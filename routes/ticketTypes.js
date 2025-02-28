// routes/ticketTypes.js
const express = require('express');
const router = express.Router();
const {
    getIssueTypeById,
    getIssueTypes,
    getRequestTypeById,
    getRequestTypes
} = require('../controllers/ticketTypesController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all issue types
router.get('/issue-types', authMiddleware, getIssueTypes);

// Get specific issue type
router.get('/issue-types/:id', authMiddleware, getIssueTypeById);

// Get all request types
router.get('/request-types', authMiddleware, getRequestTypes);

// Get specific request type
router.get('/request-types/:id', authMiddleware, getRequestTypeById);

module.exports = router;
