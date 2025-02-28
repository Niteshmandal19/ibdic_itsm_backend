const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Ticket = require('../models/Ticket');
const User = require('../models/User')
const fs = require('fs').promises;
const { Op } = require('sequelize');
const upload = require('../config/multer')


const authMiddleware = require('../middleware/authMiddleware');
const {
  createTicket,
  getTicketDetails,
  getComments,
  createComment,
  updateStatus,
  updateAssignee,
  updateComment,
  deleteComment,
  uploadComment,
  downloadCommentAttachment
} = require('../controllers/ticketController');



// Create ticket route
router.post('/create-ticket',
  authMiddleware,
  upload.array('attachments', 5), // Changed from single to array
  createTicket
);


router.put('/update-status/:id',
  authMiddleware,
  updateStatus
);

router.put('/update-assignee/:id',
  authMiddleware,
  updateAssignee
);


// Get ticket details route
router.get('/complete-incidents/:id', authMiddleware, getTicketDetails);
router.get('/comments/:id', authMiddleware, getComments);
router.put('/comments/:id', authMiddleware, updateComment);
router.delete('/comments/:id', authMiddleware, deleteComment);












router.post('/comments/:id/replies', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const parentComment = await Comment.findByPk(id);
    if (!parentComment) {
      return res.status(404).json({ message: 'Parent comment not found' });
    }

    const reply = await Comment.create({
      ticket_id: parentComment.ticket_id,
      parent_id: id,
      user_id: userId,
      content: content.trim(),
      type: 'reply'
    });

    const replyWithUser = await Comment.findOne({
      where: { id: reply.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });

    res.json(replyWithUser);
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({
      message: 'Error creating reply',
      error: error.message
    });
  }
});













router.post('/create-comments/:id', authMiddleware, createComment);

router.get('/comments/:commentId/attachment',
  authMiddleware,
  downloadCommentAttachment
);




// Fetch all tickets route
router.get('/', authMiddleware, async (req, res) => {
  const { organization_id, productCodes } = req.user;

  console.log('Organization ID:', organization_id); // Debug log
  console.log('Product Codes:', productCodes); // Debug log

  if (!productCodes || productCodes.length === 0) {
    return res.status(400).json({
      message: 'No product codes found for the user.'
    });
  }

  try {
    const whereCondition = {
      ...(organization_id !== 'IBDIC' && { organization_id }),
      project: { [Op.in]: productCodes }
    };

    const tickets = await Ticket.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['first_name', 'last_name'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['first_name', 'last_name'],
        },
      ],
      attributes: [
        'id',
        'title',
        'project',
        'issueType',
        'requestType',
        'description',
        'assignee',
        'priority',
        'created_by',
        'status',
        'createdAt',
        'organization_id',
      ],
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      message: 'Error fetching tickets',
      error: error.message
    });
  }
});



router.get('/incidents/:id', authMiddleware, async (req, res) => {
  try {
    // Extract the ticket ID from URL parameters
    const ticketId = req.params.id;

    // Fetch the ticket from the database based on the ID
    const ticket = await Ticket.findOne({
      where: { id: ticketId, organization_id: req.user.organization_id },
      attributes: [
        'id',
        'title',
        'project',
        'issueType',
        'requestType',
        'description',
        'assignee',
        'priority',
        'created_by',
        'status',
        'createdAt',
        'organization_id',
      ],
    });

    // If ticket is not found, return 404 error
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Return the ticket details
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Error fetching ticket', error: error.message });
  }
});


router.get('/download-attachment/:ticketId', authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      where: {
        id: req.params.ticketId,
        organization_id: req.user.organization_id
      }
    });

    if (!ticket || !ticket.attachment) {
      console.log('Ticket or attachment not found:', ticket);
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Get the filename from the full path
    const filename = path.basename(ticket.attachment);

    // Construct path relative to backend directory
    const uploadDir = path.join(__dirname, '../uploads/tickets');
    const filePath = path.join(uploadDir, filename);

    console.log('Upload directory:', uploadDir);
    console.log('File path:', filePath);

    // Check if file exists
    try {
      await fs.access(filePath);
      console.log('File exists at:', filePath);
    } catch (error) {
      console.log('File access error:', error);
      // Try alternative path
      const altPath = path.join(process.cwd(), ticket.attachment);
      console.log('Trying alternative path:', altPath);

      try {
        await fs.access(altPath);
        console.log('File exists at alternative path');
        // If alternative path exists, use it
        filePath = altPath;
      } catch (altError) {
        console.log('Alternative path also failed:', altError);
        return res.status(404).json({
          message: 'File not found on server',
          originalPath: ticket.attachment,
          triedPaths: [filePath, altPath]
        });
      }
    }

    // Get file extension and content type
    const fileExtension = path.extname(ticket.attachmentOriginalName).toLowerCase();
    let contentType = 'application/octet-stream';

    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif'
    };

    contentType = mimeTypes[fileExtension] || contentType;

    // Read and send file
    const fileBuffer = await fs.readFile(filePath);

    res.set({
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(ticket.attachmentOriginalName)}"`,
    });

    return res.send(fileBuffer);

  } catch (error) {
    console.error('Error in download route:', error);
    return res.status(500).json({
      message: 'Error downloading file',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;


