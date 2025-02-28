// ticketController.js
const Ticket = require('../models/Ticket');
const User = require('../models/User'); // Import User model
const Comment = require('../models/Comment')
const Attachment = require('../models/Attachment')
const TicketAssigneeLog = require('../models/TicketAssigneeLog')
const sequelize = require('../config/database'); // Import sequelize
const path = require('path');
const { Op } = require('sequelize');
const TicketStatusLog = require('../models/TicketStatusLog'); // Update the path as per your project structure
const fs = require('fs').promises;
const multer = require('multer');
const upload = require('../config/multer')
const { handleAttachments } = require('../utils/attachmentHandler');


// const { User, Ticket, Comment } = require('../models');

const nodemailer = require('nodemailer');


const createTransporter = async () => {
  // For development environment
  if (process.env.NODE_ENV === 'development') {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  // For production environment
  // return nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,
  //   secure: process.env.SMTP_PORT === '465',
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASSWORD
  //   }
  // });
};




// Email template functions
const getCreatorEmailTemplate = (ticket, creator) => ({
  from: `Support Team <${process.env.SMTP_FROM_EMAIL}>`,
  to: creator.email,
  subject: `Ticket Created: ${ticket.title} (#${ticket.id})`,
  html: `
    <h2>Your ticket has been created successfully</h2>
    <p>Hello ${creator.name},</p>
    <p>Your ticket has been created with the following details:</p>
    <ul>
      <li><strong>Ticket ID:</strong> #${ticket.id}</li>
      <li><strong>Title:</strong> ${ticket.title}</li>
      <li><strong>Priority:</strong> ${ticket.priority}</li>
      <li><strong>Status:</strong> ${ticket.status}</li>
    </ul>
    <p>We will keep you updated on any progress.</p>
  `
});

const getAssigneeEmailTemplate = (ticket, creator, assignee) => ({
  from: `Support Team <${process.env.SMTP_FROM_EMAIL}>`,
  to: assignee.email,
  subject: `New Ticket Assigned: ${ticket.title} (#${ticket.id})`,
  html: `
    <h2>A new ticket has been assigned to you</h2>
    <p>Hello ${assignee.name},</p>
    <p>A new ticket has been assigned to you with the following details:</p>
    <ul>
      <li><strong>Ticket ID:</strong> #${ticket.id}</li>
      <li><strong>Title:</strong> ${ticket.title}</li>
      <li><strong>Created by:</strong> ${creator.name}</li>
      <li><strong>Priority:</strong> ${ticket.priority}</li>
      <li><strong>Description:</strong> ${ticket.description}</li>
    </ul>
    <p>Please review and take necessary action.</p>
  `
});

// Simplified send email utility function
const sendEmail = async (emailData) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail(emailData);
    
    // For development, log the test URL
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};


const createTicket = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      project,
      issueType,
      requestType,
      title,
      description,
      assignee,
      priority,
      impact,
      status = 'Open',
      initialComment
    } = req.body;
    const created_by = req.user.id;
    const organization_id = req.user.organization_id;
    const userId = req.user.id;

    // Validate creator and assignee exist before creating ticket
    const [creator, assignedTo] = await Promise.all([
      User.findByPk(created_by),
      User.findByPk(assignee)
    ]);

    // Check if both users exist
    if (!creator) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Failed to create ticket',
        error: 'Creator user not found'
      });
    }

    if (!assignedTo) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Failed to create ticket',
        error: 'Assignee user not found'
      });
    }

    // Validate email addresses exist
    if (!creator.email || !assignee.email) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Failed to create ticket',
        error: 'Invalid email address for creator or assignee'
      });
    }

    const ticketData = {
      project,
      issueType,
      requestType,
      title,
      description,
      assignee,
      priority,
      impact,
      created_by,
      organization_id,
      status
    };

    // Create ticket within transaction
    const newTicket = await Ticket.create(ticketData, { transaction });

    // Handle multiple attachments
    if (req.files?.length) {
      await handleAttachments(req.files, {
        attachableId: newTicket.id,
        attachableType: req.body.attachableType,
        uploadedBy: req.user.id,
        transaction
      });
    }

    // Create initial comment if provided
    if (initialComment) {
      await Comment.create({
        content: initialComment,
        ticketId: newTicket.id,
        userId: userId
      }, { transaction });
    }

    // Commit transaction first
    await transaction.commit();

    // Send emails after successful ticket creation
    // try {
    //   await Promise.all([
    //     sendEmail(getCreatorEmailTemplate(newTicket, creator)),
    //     sendEmail(getAssigneeEmailTemplate(newTicket, creator, assignedTo))
    //   ]);
    // } catch (emailError) {
    //   // Log email error but don't fail the ticket creation
    //   console.error('Failed to send notification emails:', emailError);
    // }

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: newTicket
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Ticket creation error:', error);
    res.status(500).json({
      message: 'Failed to create ticket',
      error: error.message
    });
  }
};










// const createTicket = async (req, res) => {
//   const transaction = await sequelize.transaction();
//   // In your ticket creation controller
//   try {
//     const {
//       project,
//       issueType,
//       requestType,
//       title,
//       description,
//       assignee,
//       priority,
//       impact,
//       status = 'Open',
//       initialComment // Optional initial comment
//     } = req.body;

//     const created_by = req.user.id;
//     const organization_id = req.user.organization_id;
//     const userId = req.user.id; // Assuming user ID is available in the request

//     const ticketData = {
//       project,
//       issueType,
//       requestType,
//       title,
//       description,
//       assignee,
//       priority,
//       impact,
//       created_by,
//       organization_id,
//       status
//     };
//     console.log(ticketData);

//     if (req.file) {
//       ticketData.attachment = req.file.path;
//       ticketData.attachmentOriginalName = req.file.originalname;
//     }

//     // Create ticket within transaction
//     const newTicket = await Ticket.create(ticketData, { transaction });

//     // Create initial comment if provided
//     if (initialComment) {
//       await Comment.create({
//         content: initialComment,
//         ticketId: newTicket.id,
//         userId: userId
//       }, { transaction });
//     }

//     // Commit transaction
//     await transaction.commit();

//     res.status(201).json({
//       message: 'Ticket created successfully',
//       ticket: newTicket
//     });
//   } catch (error) {
//     // Rollback transaction in case of error
//     await transaction.rollback();

//     console.error('Ticket creation error:', error);
//     res.status(500).json({
//       message: 'Failed to create ticket',
//       error: error.message
//     });
//   }
// };



const getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findByPk(id, {
      include: [
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'first_name', 'email'],
            }
          ],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'first_name', 'last_name'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name'],
        }
      ],
      order: [[{ model: Comment, as: 'comments' }, 'created_at', 'ASC']], // Updated to use created_at
    });

    if (!ticket) {
      console.warn(`No ticket found with ID: ${id}`);
      return res.status(404).json({ message: 'Ticket not found' });
    }

    console.debug(`Ticket found: ${JSON.stringify(ticket, null, 2)}`);

    res.json(ticket);
  } catch (error) {
    console.error(`Error fetching ticket details for ID ${req.params.id}:`, error);
    res.status(500).json({
      message: 'Failed to fetch ticket details',
      error: error.message,
    });
  }
};


// New function to get ticket details
// const getComments = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const ticket = await Ticket.findByPk(id, {
//       include: [
//         {
//           model: Comment,
//           as: 'comments',
//           include: [
//             {
//               model: User,
//               as: 'user',
//               attributes: ['id', 'username', 'email']
//             }
//           ]
//         }
//       ]
//     });

//     if (!ticket) {
//       return res.status(404).json({ message: 'Ticket not found' });
//     }

//     res.json(ticket.comments); // Return only comments
//   } catch (error) {
//     console.error('Error fetching ticket details:', error);
//     res.status(500).json({
//       message: 'Failed to fetch ticket details',
//       error: error.message
//     });
//   }
// };



// const createComment = async (req, res) => {
//   try {
//     const { id } = req.params;
//   const { content } = req.body;
//   const userId = req.user.id;
//   const ticketId = id;



//     // Validate inputs
//     if (!content || content.trim() === '') {
//       return res.status(400).json({ message: 'Comment content cannot be empty' });
//     }

//     if (!ticketId) {
//       return res.status(400).json({ message: 'Ticket ID is required' });
//     }

//     console.log("create-comment-userID", userId);

//     // Optional: Verify ticket exists
//     const ticket = await Ticket.findByPk(ticketId);
//     if (!ticket) {
//       return res.status(404).json({ message: 'Ticket not found' });
//     }
//     console.log("createcommet", ticketId, userId);

//     const comment = await Comment.create({
//       ticket_id:ticketId,
//       user_id:userId,
//       content: content.trim()
//     });

//     res.status(201).json(comment);
//   } catch (error) {
//     console.error('Comment creation error:', error);
//     res.status(500).json({
//       message: 'Error creating comment',
//       details: error.message,
//       // Optional: include more error details for debugging
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// };



























// const getComments = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userOrganizationId = req.user.organization_id;

//     let queryOptions = {
//       where: { ticket_id: id }
//     };

//     // If user is not from IBDIC, exclude internal comments
//     if (userOrganizationId !== 'IBDIC') {
//       queryOptions.where.type = {
//         [Op.ne]: 'internal'  // Op should be imported from sequelize
//       };
//     }

//     const comments = await Comment.findAll({
//       ...queryOptions,
//       include: [
//         {
//           model: User,
//           as: 'user',
//           attributes: ['id', 'email', 'first_name', 'last_name', 'organization_id']
//         }
//       ],
//       order: [['created_at', 'DESC']]
//     });

//     res.json(comments);
//   } catch (error) {
//     console.error('Error fetching comments:', error);
//     res.status(500).json({
//       message: 'Failed to fetch comments',
//       error: error.message
//     });
//   }
// };



// const getComments = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userOrganizationId = req.user.organization_id;

//     let queryOptions = {
//       where: { 
//         ticket_id: id,
//         parent_id: null  // Only get top-level comments
//       }
//     };

//     if (userOrganizationId !== 'IBDIC') {
//       queryOptions.where.type = {
//         [Op.ne]: 'internal'
//       };
//     }

//     const comments = await Comment.findAll({
//       ...queryOptions,
//       include: [
//         {
//           model: User,
//           as: 'user',
//           attributes: ['id', 'email', 'first_name', 'last_name', 'organization_id']
//         },
//         {
//           model: Comment,
//           as: 'replies',
//           include: [{
//             model: User,
//             as: 'user',
//             attributes: ['id', 'email', 'first_name', 'last_name', 'organization_id']
//           }]
//         }
//       ],
//       order: [
//         ['created_at', 'DESC'],
//         [{ model: Comment, as: 'replies' }, 'created_at', 'ASC']
//       ]
//     });

//     res.json(comments);
//   } catch (error) {
//     console.error('Error fetching comments:', error);
//     res.status(500).json({
//       message: 'Failed to fetch comments',
//       error: error.message
//     });
//   }
// };

const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const userOrganizationId = req.user.organization_id;

    let queryOptions = {
      where: { 
        ticket_id: id,
        parent_id: null  // Only get top-level comments
      }
    };

    // Base condition for non-internal comments
    const nonInternalCondition = {
      type: {
        [Op.ne]: 'internal'
      }
    };

    // If user is not from IBDIC, filter out internal comments
    if (userOrganizationId !== 'IBDIC') {
      queryOptions.where = {
        ...queryOptions.where,
        ...nonInternalCondition
      };
    }

    const comments = await Comment.findAll({
      ...queryOptions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name', 'organization_id']
        },
        {
          model: Comment,
          as: 'replies',
          // Apply the same internal comment filter to replies for non-IBDIC users
          where: userOrganizationId !== 'IBDIC' ? nonInternalCondition : undefined,
          required: false, // Make this false so comments without replies still show up
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'first_name', 'last_name', 'organization_id']
          }]
        },
        {
          model: Attachment,
          as: 'attachments'
        }
      ],
      order: [
        ['created_at', 'DESC'],
        [{ model: Comment, as: 'replies' }, 'created_at', 'ASC']
      ]
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
};

























// Modify your createComment controller
// const createComment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { content, type } = req.body;
//     const userId = req.user.id;
//     const userOrganizationId = req.user.organization_id;

//     // Validate inputs
//     if (!content || content.trim() === '') {
//       return res.status(400).json({ message: 'Comment content cannot be empty' });
//     }

//     // Check if user can create internal comments
//     if (type === 'internal' && userOrganizationId !== 'IBDIC') {
//       return res.status(403).json({ 
//         message: 'Only IBDIC users can create internal comments' 
//       });
//     }

//     const ticket = await Ticket.findByPk(id);
//     if (!ticket) {
//       return res.status(404).json({ message: 'Ticket not found' });
//     }

//     const comment = await Comment.create({
//       ticket_id: id,
//       user_id: userId,
//       content: content.trim(),
//       type: type,
//       is_internal: type === 'internal'
//     });

//     // Fetch the created comment with user details
//     const createdComment = await Comment.findByPk(comment.id, {
//       include: [{
//         model: User,
//         as: 'user',
//         attributes: ['id', 'first_name', 'last_name', 'email', 'organization_id']
//       }]
//     });

//     res.status(201).json(createdComment);
//   } catch (error) {
//     console.error('Comment creation error:', error);
//     res.status(500).json({
//       message: 'Error creating comment',
//       error: error.message
//     });
//   }
// };


// const createComment = async (req, res) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const { id } = req.params;
//     const { content, type } = req.body;
//     const userId = req.user.id;
//     const file = req.file; // Assuming you're using multer for file uploads

//     if (!content || content.trim() === '') {
//       return res.status(400).json({ message: 'Comment content cannot be empty' });
//     }

//     const commentData = {
//       ticket_id: id,
//       user_id: userId,
//       content: content.trim(),
//       type: type,
//       is_internal: type === 'internal'
//     };

//     // If there's a file, add attachment info
//     if (file) {
//       commentData.attachment = file.filename;
//       commentData.attachmentOriginalName = file.originalname;
//       commentData.attachmentType = file.mimetype;
//     }

//     const comment = await Comment.create(commentData, { transaction });

//     const createdComment = await Comment.findByPk(comment.id, {
//       include: [{
//         model: User,
//         as: 'user',
//         attributes: ['id', 'first_name', 'last_name', 'email']
//       }],
//       transaction
//     });

//     await transaction.commit();
//     res.status(201).json(createdComment);
//   } catch (error) {
//     await transaction.rollback();
//     console.error('Comment creation error:', error);
//     res.status(500).json({
//       message: 'Error creating comment',
//       error: error.message
//     });
//   }
// };

// const downloadCommentAttachment = async (req, res) => {
//   try {
//     const { commentId } = req.params;
//     const comment = await Comment.findByPk(commentId);

//     if (!comment || !comment.attachment) {
//       return res.status(404).json({ message: 'Attachment not found' });
//     }

//     const filePath = path.join(__dirname, '../uploads', comment.attachment);
//     res.download(filePath, comment.attachmentOriginalName);
//   } catch (error) {
//     console.error('Error downloading attachment:', error);
//     res.status(500).json({ message: 'Error downloading attachment' });
//   }
// };























// const commentStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/comments/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, `comment-${Date.now()}${path.extname(file.originalname)}`);
//   }
// });

// // Multer upload configuration for comments
// const uploadComment = multer({
//   storage: commentStorage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB file size limit
//   }
// }).single('attachment'); // Specifically handle only 'attachment' field

// // Modified createComment controller with proper error handling
// const createComment = async (req, res) => {
//   // Handle file upload first
//   uploadComment(req, res, async (err) => {
//     if (err instanceof multer.MulterError) {
//       return res.status(400).json({
//         message: 'File upload error',
//         error: err.message
//       });
//     } else if (err) {
//       return res.status(500).json({
//         message: 'Server error during file upload',
//         error: err.message
//       });
//     }
    
//     // Start transaction after successful file upload
//     const transaction = await sequelize.transaction();
//     try {
//       const { id: ticket_id } = req.params;
//       const { content, type } = req.body;

//       // Validate required fields
//       if (!type || !['internal', 'open', 'system', 'status_change'].includes(type)) {
//         await transaction.rollback();
//         return res.status(400).json({
//           message: 'Invalid comment type',
//           receivedType: type
//         });
//       }

//       // Prepare comment data
//       const commentData = {
//         ticket_id,
//         content: content || 'File attachment',
//         type,
//         user_id: req.user.id,
//         is_internal: type === 'internal',
//         created_at: new Date()
//       };

//       // Add file information if present
//       if (req.file) {
//         commentData.attachment = req.file.path;
//         commentData.attachment_original_name = req.file.originalname;
//         commentData.attachment_type = req.file.mimetype;
//       }

//       // Create comment
//       const comment = await Comment.create(commentData, { transaction });
      
//       // Fetch created comment with user details
//       const createdComment = await Comment.findOne({
//         where: { id: comment.id },
//         include: [{
//           model: User,
//           as: 'user',
//           attributes: ['first_name', 'last_name'],
//         }],
//       });

//       await transaction.commit();
//       res.status(201).json(createdComment);

//     } catch (error) {
//       await transaction.rollback();
//       console.error('Error creating comment:', error);
//       res.status(500).json({
//         message: 'Failed to create comment',
//         error: error.message
//       });
//     }
//   });
// };








// latest on 24-01-2025

const createComment = async (req, res) => {
  // Attach attachableType for multer storage
  req.body.attachableType = 'comment';

  upload.array('attachments', 5)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    }
    
    const transaction = await sequelize.transaction();
    try {
      const { id: ticket_id } = req.params;
      const { content, type } = req.body;

      // Validate required fields
      if (!type || !['internal', 'open', 'system', 'status_change'].includes(type)) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Invalid comment type',
          receivedType: type
        });
      }

      // Prepare comment data
      const commentData = {
        ticket_id,
        content: content || 'File attachment',
        type,
        user_id: req.user.id,
        is_internal: type === 'internal',
        created_at: new Date()
      };

      // Create comment
      const comment = await Comment.create(commentData, { transaction });
      
      // Handle multiple file attachments
      if (req.files && req.files.length > 0) {
        const attachmentPromises = req.files.map(file => 
          Attachment.create({
            attachableId: comment.id,
            attachableType: 'Comment',
            filePath: file.path,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            uploadedBy: req.user.id
          }, { transaction })
        );
        
        await Promise.all(attachmentPromises);
      }

      // Fetch created comment with user and attachment details
      const createdComment = await Comment.findOne({
        where: { id: comment.id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['first_name', 'last_name']
          },
          {
            model: Attachment,
            as: 'attachments',
            required: false
          }
        ],
        transaction
      });

      await transaction.commit();
      res.status(201).json(createdComment);

    } catch (error) {
      await transaction.rollback();
      console.error('Error creating comment:', error);
      res.status(500).json({
        message: 'Failed to create comment',
        error: error.message
      });
    }
  });
};



//latest on 24 Jan 2025

const downloadCommentAttachment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Find comment with ticket and organization validation
    const comment = await Comment.findOne({
      where: { id: commentId },
      include: [{
        model: Ticket,
        as: 'ticket',
        where: { organization_id: req.user.organization_id }
      }],
      include: [{ model: Attachment, as: 'attachments' }]
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or access denied' });
    }

    const attachment = comment.attachments[0];
    if (!attachment) {
      return res.status(404).json({ message: 'No attachment found for this comment' });
    }

    const filePath = attachment.filePath;
    const filename = attachment.originalName;

    // Validate file path security
    const normalizedPath = path.normalize(filePath);
    const uploadDir = path.join(__dirname, '../uploads');
    if (!normalizedPath.startsWith(uploadDir)) {
      return res.status(403).json({ message: 'Invalid file path' });
    }

    // Check file existence
    try {
      await fs.access(normalizedPath);
    } catch (error) {
      return res.status(404).json({ 
        message: 'File not found', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }

    // Determine content type
    const contentType = mime.lookup(filename) || 'application/octet-stream';

    // Stream file for better performance with large files
    const fileStream = fs.createReadStream(normalizedPath);
    
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `${req.query.preview ? 'inline' : 'attachment'}; filename="${encodeURIComponent(filename)}"`,
    });

    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('File streaming error:', err);
      if (!res.headersSent) {
        return res.status(500).json({ 
          message: 'Error streaming file', 
          details: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
      }
    });

  } catch (error) {
    console.error('Error downloading comment attachment:', error);
    return res.status(500).json({
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};










// const downloadCommentAttachment = async (req, res) => {
//   try {
//     const { commentId } = req.params;

//     const comment = await Comment.findOne({
//       where: { id: commentId },
//       include: [{
//         model: Ticket,
//         as: 'ticket',
//         where: { organization_id: req.user.organization_id }
//       }]
//     });

//     if (!comment) {
//       return res.status(404).json({ message: 'Comment not found' });
//     }

//     if (!comment.attachment) {
//       return res.status(404).json({ message: 'No attachment found for this comment' });
//     }

//     // Get the filename from the full path
//     const filename = path.basename(comment.attachment);
//     if (!filename) {
//       return res.status(404).json({ message: 'Invalid attachment path' });
//     }

//     // Construct path relative to backend directory
//     const uploadDir = path.join(__dirname, '../uploads/comments');
//     const filePath = path.join(uploadDir, filename);

//     // Check if file exists
//     try {
//       await fs.access(filePath);
//     } catch (error) {
//       console.error('File access error:', error);
//       return res.status(404).json({
//         message: 'File not found on server',
//         details: process.env.NODE_ENV === 'development' ? error.message : undefined
//       });
//     }

//     // Validate file path to prevent directory traversal
//     const normalizedPath = path.normalize(filePath);
//     if (!normalizedPath.startsWith(uploadDir)) {
//       return res.status(403).json({ message: 'Invalid file path' });
//     }

//     // Get file extension and content type
//     const fileExtension = path.extname(comment.attachmentOriginalName || '').toLowerCase();
//     const mimeTypes = {
//       '.pdf': 'application/pdf',
//       '.png': 'image/png',
//       '.jpg': 'image/jpeg',
//       '.jpeg': 'image/jpeg',
//       '.gif': 'image/gif',
//       '.doc': 'application/msword',
//       '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       '.xls': 'application/vnd.ms-excel',
//       '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       '.txt': 'text/plain'
//     };

//     const contentType = mimeTypes[fileExtension] || 'application/octet-stream';

//     try {
//       // Read and send file
//       const fileBuffer = await fs.readFile(filePath);

//       res.set({
//         'Content-Type': contentType,
//         'Content-Length': fileBuffer.length,
//         'Content-Disposition': `attachment; filename="${encodeURIComponent(comment.attachmentOriginalName || filename)}"`,
//       });

//       return res.send(fileBuffer);
//     } catch (error) {
//       console.error('File read error:', error);
//       return res.status(500).json({
//         message: 'Error reading file',
//         details: process.env.NODE_ENV === 'development' ? error.message : undefined
//       });
//     }
//   } catch (error) {
//     console.error('Error downloading comment attachment:', error);
//     return res.status(500).json({
//       message: 'Error downloading file',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };



// const updateStatus = async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;
//   const userId = req.user.id;

//   const transaction = await sequelize.transaction();

//   try {
//     const existingTicket = await Ticket.findByPk(id, { transaction });

//     if (!existingTicket) {
//       await transaction.rollback();
//       return res.status(404).json({ message: 'Ticket not found' });
//     }

//     if (existingTicket.status === status) {
//       await transaction.rollback();
//       return res.status(200).json(existingTicket);
//     }

//     // Store previous status before updating
//     existingTicket.previousStatus = existingTicket.status;
//     existingTicket.status = status;
//     await existingTicket.save({ transaction });

//     const user = await User.findByPk(userId, {
//       attributes: ['id', 'first_name'],
//       transaction
//     });

//     // Fixed column names to match database schema
//     await Comment.create({
//       ticket_id: id,         // Changed from ticketId
//       user_id: userId,       // Changed from userId
//       content: `${user.first_name} changed the ticket status from ${existingTicket.previousStatus} to ${status}`,
//       type: 'system'
//     }, { transaction });

//     await TicketStatusLog.create({
//       ticket_id: id,
//       previousStatus: existingTicket.previousStatus,
//       newStatus: status,
//       changedById: userId
//     }, { transaction });

//     const updatedTicket = await Ticket.findByPk(id, {
//       include: [
//         {
//           model: User,
//           as: 'assignedTo',
//           attributes: ['id', 'first_name', 'email']
//         },
//         {
//           model: User,
//           as: 'creator',
//           attributes: ['id', 'first_name', 'email']
//         },
//         {
//           model: Comment,
//           as: 'comments',
//           include: [{
//             model: User,
//             as: 'user',
//             attributes: ['id', 'first_name', 'email']
//           }]
//         }
//       ],
//       transaction
//     });

//     await transaction.commit();
//     res.status(200).json(updatedTicket);
//   } catch (error) {
//     await transaction.rollback();
//     console.error('Error updating ticket:', error);
//     res.status(500).json({
//       message: 'Error updating ticket',
//       error: error.message
//     });
//   }
// };

// const updateStatus = async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;
//   const userId = req.user.id;

//   const transaction = await sequelize.transaction();

//   try {
//     const existingTicket = await Ticket.findByPk(id, { transaction });

//     if (!existingTicket) {
//       await transaction.rollback();
//       return res.status(404).json({ message: 'Ticket not found' });
//     }

//     if (existingTicket.status === status) {
//       await transaction.rollback();
//       return res.status(200).json(existingTicket);
//     }

//     const oldStatus = existingTicket.status;
//     existingTicket.status = status;
//     await existingTicket.save({ transaction });

//     // Create the status change comment
//     // await Comment.create({
//     //   ticket_id: id,
//     //   user_id: userId,
//     //   content: `Status changed from ${oldStatus} to ${status}`,
//     //   type: 'status_change',
//     //   is_internal: false
//     // }, { transaction });

//     const statusComment = await Comment.create({
//       ticket_id: id,
//       user_id: userId,
//       content: JSON.stringify({
//         oldStatus: oldStatus,
//         newStatus: status
//       }),
//       type: 'status_change',
//       is_internal: false
//     }, { transaction });

//     // Log the status change
//     await TicketStatusLog.create({
//       ticket_id: id,
//       previousStatus: oldStatus,
//       newStatus: status,
//       changedById: userId
//     }, { transaction });

//     const updatedTicket = await Ticket.findByPk(id, {
//       include: [
//         {
//           model: User,
//           as: 'assignedTo',
//           attributes: ['id', 'first_name', 'email']
//         },
//         {
//           model: User,
//           as: 'creator',
//           attributes: ['id', 'first_name', 'email']
//         },
//         {
//           model: Comment,
//           as: 'comments',
//           include: [{
//             model: User,
//             as: 'user',
//             attributes: ['id', 'first_name', 'email']
//           }]
//         }
//       ],
//       transaction
//     });

//     await transaction.commit();
//     res.status(200).json(existingTicket);
//   } catch (error) {
//     await transaction.rollback();
//     console.error('Error updating ticket:', error);
//     res.status(500).json({
//       message: 'Error updating ticket',
//       error: error.message
//     });
//   }
// };


const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  const transaction = await sequelize.transaction();

  try {
    // Fetch the existing ticket with necessary associations
    const existingTicket = await Ticket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      transaction
    });

    // Check if ticket exists
    if (!existingTicket) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // If status hasn't changed, return early
    if (existingTicket.status === status) {
      await transaction.rollback();
      return res.status(200).json(existingTicket);
    }

    // Store old status and update to new status
    const oldStatus = existingTicket.status;
    existingTicket.status = status;
    await existingTicket.save({ transaction });

    // Get user info for the status change comment
    const user = await User.findByPk(userId, {
      attributes: ['id', 'first_name', 'last_name'],
      transaction
    });

    // Create status change comment
    const statusComment = await Comment.create({
      ticket_id: id,
      user_id: userId,
      content: JSON.stringify({
        oldStatus: oldStatus,
        newStatus: status
      }),
      type: 'status_change',
      is_internal: false
    }, { transaction });

    // Create status change log entry
    await TicketStatusLog.create({
      ticket_id: id,
      previousStatus: oldStatus,
      newStatus: status,
      changedById: userId
    }, { transaction });

    // Fetch the updated ticket with all necessary associations
    const updatedTicket = await Ticket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }]
        }
      ],
      transaction
    });

    // Optional: Add notification logic here
    try {
      // Notify assigned user if status changes to "In Progress"
      if (status === 'In Progress' && updatedTicket.assignedTo) {
        // Add your notification logic here
        // Example: await sendStatusChangeNotification(updatedTicket.assignedTo.email, oldStatus, status);
      }

      // Notify creator if status changes to "Resolved"
      if (status === 'Resolved' && updatedTicket.creator) {
        // Add your notification logic here
        // Example: await sendStatusChangeNotification(updatedTicket.creator.email, oldStatus, status);
      }
    } catch (notificationError) {
      // Log notification error but don't fail the transaction
      console.error('Notification error:', notificationError);
    }

    // Commit the transaction
    await transaction.commit();

    // Send response
    res.status(200).json({
      ticket: updatedTicket,
      statusComment,
      message: 'Ticket status updated successfully'
    });

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();

    console.error('Error updating ticket status:', error);

    // Send appropriate error response
    res.status(500).json({
      message: 'Error updating ticket status',
      error: error.message
    });
  }
};






const updateAssignee = async (req, res) => {
  const { id } = req.params;
  const { assigneeId } = req.body;
  const userId = req.user.id;

  const transaction = await sequelize.transaction();

  try {
    // Fetch the existing ticket with necessary associations
    const existingTicket = await Ticket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      transaction
    });

    // Check if ticket exists
    if (!existingTicket) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Get the new assignee user
    const newAssignee = await User.findByPk(assigneeId, {
      attributes: ['id', 'first_name', 'last_name', 'email'],
      transaction
    });

    // Check if new assignee exists
    if (!newAssignee) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Assignee not found' });
    }

    // If assignee hasn't changed, return early
    if (existingTicket.assignee?.id === assigneeId) {
      await transaction.rollback();
      return res.status(200).json(existingTicket);
    }

    // Store old assignee and update to new assignee
    const oldAssignee = existingTicket.assignedTo;
    existingTicket.assignee = assigneeId;

    // Check if ticket is open and update status to "In Progress"
    const oldStatus = existingTicket.status;
    if (oldStatus === 'Open') {
      existingTicket.status = 'In Progress';
    }

    await existingTicket.save({ transaction });

    // Get user info for the changes
    const user = await User.findByPk(userId, {
      attributes: ['id', 'first_name', 'last_name'],
      transaction
    });

    // Create assignee change comment
    const assigneeComment = await Comment.create({
      ticket_id: id,
      user_id: userId,
      content: JSON.stringify({
        oldAssignee: oldAssignee ? `${oldAssignee.first_name} ${oldAssignee.last_name}` : 'Unassigned',
        newAssignee: `${newAssignee.first_name} ${newAssignee.last_name}`
      }),
      type: 'assignee_change',
      is_internal: false
    }, { transaction });

    // Create assignee change log entry
    await TicketAssigneeLog.create({
      ticket_id: id,
      previousAssigneeId: oldAssignee?.id || null,
      newAssigneeId: assigneeId,
      changedById: userId
    }, { transaction });

    // If status was changed, create status change records
    if (oldStatus === 'Open') {
      // Create status change comment
      await Comment.create({
        ticket_id: id,
        user_id: userId,
        content: JSON.stringify({
          oldStatus: oldStatus,
          newStatus: 'In Progress'
        }),
        type: 'status_change',
        is_internal: false
      }, { transaction });

      // Create status change log entry
      await TicketStatusLog.create({
        ticket_id: id,
        previousStatus: oldStatus,
        newStatus: 'In Progress',
        changedById: userId
      }, { transaction });
    }

    // Fetch the updated ticket with all necessary associations
    const updatedTicket = await Ticket.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }]
        }
      ],
      transaction
    });

    // Optional: Add notification logic here
    try {
      // Notify new assignee
      if (newAssignee) {
        // Add your notification logic here
        // Example: await sendAssigneeChangeNotification(newAssignee.email, existingTicket.title);
      }

      // Notify creator if they're different from the assigner
      if (existingTicket.creator && existingTicket.creator.id !== userId) {
        // Add your notification logic here
        // Example: await sendAssigneeChangeNotification(existingTicket.creator.email, existingTicket.title);
      }
    } catch (notificationError) {
      // Log notification error but don't fail the transaction
      console.error('Notification error:', notificationError);
    }

    // Commit the transaction
    await transaction.commit();

    // Send response
    res.status(200).json({
      ticket: updatedTicket,
      assigneeComment,
      message: 'Ticket assignee updated successfully'
    });

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();

    console.error('Error updating ticket assignee:', error);

    // Send appropriate error response
    res.status(500).json({
      message: 'Error updating ticket assignee',
      error: error.message
    });
  }
};











// Backend: Updated comment controller
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Find the comment with author information
    const comment = await Comment.findOne({
      where: { id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });

    // Check if comment exists
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is authorized to edit this comment
    if (comment.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    // Check if comment type is editable
    if (['system', 'status_change'].includes(comment.type)) {
      return res.status(403).json({
        message: 'System and status change comments cannot be modified'
      });
    }

    // Validate content
    if (!content || content.trim() === '') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: ['Comment content cannot be empty']
      });
    }

    // Update content only
    comment.content = content.trim();
    await comment.save();

    res.json(comment);

  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      message: 'Error updating comment',
      error: error.message
    });
  }
};


const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the user is authorized to delete this comment
    if (comment.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.destroy();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      message: 'Error deleting comment',
      error: error.message
    });
  }
};



module.exports = {
  createTicket,
  getTicketDetails,
  getComments,
  createComment,
  updateStatus,
  updateAssignee,
  updateComment,
  deleteComment,
  downloadCommentAttachment,
  // uploadComment
};
