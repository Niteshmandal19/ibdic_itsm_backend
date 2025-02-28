const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../config/multer');
const Comment = require('../models/Comment');

// Get all comments (including replies) for a ticket
router.get('/tickets/:id/comments', authMiddleware, commentController.getComments);

// Add a reply to a comment
router.post(
  '/tickets/comments/:id/replies',
  authMiddleware,
  upload.array('attachments',1),
  commentController.addReply
);

// Update a reply
router.put(
  '/comments/:id',
  authMiddleware,
  commentController.updateReply
);

// Delete a reply
router.delete(
  '/comments/:id',
  authMiddleware,
  commentController.deleteReply
);

module.exports = router;
