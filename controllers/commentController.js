const User = require('../models/User'); // Import User model
const Comment = require('../models/Comment')
const Attachment = require('../models/Attachment')
const { handleAttachments } = require('../utils/attachmentHandler');
const sequelize = require('../config/database');
const { Op } = require('sequelize'); 

const commentController = {
  // Get all comments with replies for a ticket
  getComments: async (req, res) => {
    try {
      const { id } = req.params; // ticket_id
      const userOrganizationId = req.user.organization_id;
      let queryOptions = {
        where: { 
          ticket_id: id,
          parent_id: null // Only get top-level comments
        }
      };

      // If user is not from IBDIC, exclude internal comments
      if (userOrganizationId !== 'IBDIC') {
        queryOptions.where.type = {
          [Op.ne]: 'internal'
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
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'first_name', 'last_name', 'organization_id']
            }],
            order: [['created_at', 'ASC']] // Order replies chronologically
          },
          {
            model: Attachment,
            as: 'attachments'
          }
        ],
        order: [['created_at', 'DESC']] // Order main comments by newest first
      });

      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({
        message: 'Failed to fetch comments',
        error: error.message
      });
    }
  },

  // Add a reply to a comment
  addReply: async (req, res) => {
    try {
      const { id } = req.params; // parent comment id
      const { content } = req.body;
      const userId = req.user.id;

      // Validate content
      if (!content?.trim()) {
        return res.status(400).json({
          message: 'Reply content cannot be empty'
        });
      }

      // Find parent comment
      const parentComment = await Comment.findByPk(id);
      if (!parentComment) {
        return res.status(404).json({
          message: 'Parent comment not found'
        });
      }

      // Create reply
      const reply = await Comment.create({
        ticket_id: parentComment.ticket_id,
        parent_id: id,
        user_id: userId,
        content: content.trim(),
        type: 'reply'
      });

      // If there are attachments, handle them
      if (req.files?.length > 0) {
        await handleAttachments(req.files, {
          attachableId: reply.id,
          attachableType: 'Comment',
          uploadedBy: userId
        });
      }

      // Fetch reply with user details
      const replyWithDetails = await Comment.findOne({
        where: { id: reply.id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'first_name', 'last_name', 'organization_id']
          },
          {
            model: Attachment,
            as: 'attachments'
          }
        ]
      });

      res.status(201).json(replyWithDetails);
    } catch (error) {
      console.error('Error adding reply:', error);
      res.status(500).json({
        message: 'Failed to add reply',
        error: error.message
      });
    }
  },

  // Update a reply
  updateReply: async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      // Validate content
      if (!content?.trim()) {
        return res.status(400).json({
          message: 'Reply content cannot be empty'
        });
      }

      // Find the reply
      const reply = await Comment.findOne({
        where: { id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }]
      });

      // Check if reply exists
      if (!reply) {
        return res.status(404).json({
          message: 'Reply not found'
        });
      }

      // Check if user is authorized to edit this reply
      if (reply.user_id !== userId) {
        return res.status(403).json({
          message: 'Not authorized to edit this reply'
        });
      }

      // Update reply
      reply.content = content.trim();
      await reply.save();

      res.json(reply);
    } catch (error) {
      console.error('Error updating reply:', error);
      res.status(500).json({
        message: 'Failed to update reply',
        error: error.message
      });
    }
  },

  // Delete a reply
  deleteReply: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const reply = await Comment.findOne({
        where: { id },
        include: [
          {
            model: Attachment,
            as: 'attachments'
          }
        ]
      });

      if (!reply) {
        return res.status(404).json({
          message: 'Reply not found'
        });
      }

      // Check if user is authorized to delete this reply
      if (reply.user_id !== userId) {
        return res.status(403).json({
          message: 'Not authorized to delete this reply'
        });
      }

      // Delete associated attachments first
      if (reply.attachments?.length > 0) {
        await Promise.all(reply.attachments.map(attachment => attachment.destroy()));
      }

      // Delete the reply
      await reply.destroy();

      res.json({
        message: 'Reply deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting reply:', error);
      res.status(500).json({
        message: 'Failed to delete reply',
        error: error.message
      });
    }
  }
};

module.exports = commentController;