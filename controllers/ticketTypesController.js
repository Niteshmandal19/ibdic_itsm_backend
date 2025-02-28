const IssueType = require('../models/IssueType');
const RequestType = require('../models/RequestType');
const { User, Ticket, sequelize } = require('../models/index');
const { Op } = require('sequelize');

const getIssueTypes = async (req, res) => {
    try {
        const issueTypes = await IssueType.getAll();
        res.json({ success: true, issueTypes });
    } catch (error) {
        console.error('Error in getIssueTypes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch issue types'
        });
    }
};

const getRequestTypes = async (req, res) => {
    try {
        const requestTypes = await RequestType.getAll();
        res.json({ success: true, requestTypes });
    } catch (error) {
        console.error('Error in getRequestTypes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch request types'
        });
    }
};

const getIssueTypeById = async (req, res) => {
    try {
        const issueType = await IssueType.getById(req.params.id);
        if (!issueType) {
            return res.status(404).json({
                success: false,
                message: 'Issue type not found'
            });
        }
        res.json({ success: true, issueType });
    } catch (error) {
        console.error('Error in getIssueTypeById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch issue type'
        });
    }
};

const getRequestTypeById = async (req, res) => {
    try {
        const requestType = await RequestType.getById(req.params.id);
        if (!requestType) {
            return res.status(404).json({
                success: false,
                message: 'Request type not found'
            });
        }
        res.json({ success: true, requestType });
    } catch (error) {
        console.error('Error in getRequestTypeById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch request type'
        });
    }
};

module.exports = {
    getIssueTypes,
    getIssueTypeById,
    getRequestTypes,
    getRequestTypeById
};


// controllers/ticketTypesController.js
// const IssueType = require('../models/IssueType');
// const RequestType = require('../models/RequestType');

// const ticketTypesController = {
//     async getIssueTypes(req, res) {
//         try {
//             const issueTypes = await IssueType.getAll();
//             res.json({ success: true, issueTypes });
//         } catch (error) {
//             console.error('Error in getIssueTypes:', error);
//             res.status(500).json({
//                 success: false,
//                 message: 'Failed to fetch issue types'
//             });
//         }
//     },

//     async getRequestTypes(req, res) {
//         try {
//             const requestTypes = await RequestType.getAll();
//             res.json({ success: true, requestTypes });
//         } catch (error) {
//             console.error('Error in getRequestTypes:', error);
//             res.status(500).json({
//                 success: false,
//                 message: 'Failed to fetch request types'
//             });
//         }
//     },

//     async getIssueTypeById(req, res) {
//         try {
//             const issueType = await IssueType.getById(req.params.id);
//             if (!issueType) {
//                 return res.status(404).json({
//                     success: false,
//                     message: 'Issue type not found'
//                 });
//             }
//             res.json({ success: true, issueType });
//         } catch (error) {
//             console.error('Error in getIssueTypeById:', error);
//             res.status(500).json({
//                 success: false,
//                 message: 'Failed to fetch issue type'
//             });
//         }
//     },

//     async getRequestTypeById(req, res) {
//         try {
//             const requestType = await RequestType.getById(req.params.id);
//             if (!requestType) {
//                 return res.status(404).json({
//                     success: false,
//                     message: 'Request type not found'
//                 });
//             }
//             res.json({ success: true, requestType });
//         } catch (error) {
//             console.error('Error in getRequestTypeById:', error);
//             res.status(500).json({
//                 success: false,
//                 message: 'Failed to fetch request type'
//             });
//         }
//     }
// };

// module.exports = ticketTypesController;
