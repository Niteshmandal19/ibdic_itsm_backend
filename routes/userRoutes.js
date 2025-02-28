const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, userController.getUserProfile);
router.post('/createUser', authMiddleware, userController.createUser);
router.get('/assignee', authMiddleware, userController.getAssignee);
router.get('/getUserDetailByOrganization', authMiddleware, userController.getUserDetailByOrganization);
router.get('/organizations', authMiddleware, userController.getOrganizations);

router.get('/:id', authMiddleware, userController.getUserById);
router.put('/:id', authMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, userController.deleteUser);
// router.delete('/soft-delete/:id', authMiddleware, userController.softDeleteUser);



module.exports = router;

