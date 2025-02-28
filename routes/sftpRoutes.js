const express = require('express');
const router = express.Router();
const sftpController = require('../controllers/sftpController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../config/multer')

router.get('/files', authMiddleware, sftpController.getSftpFiles);
router.get('/fileNames', authMiddleware, sftpController.getFileNames);



router.post('/upload', authMiddleware, upload.array('attachments', 1), sftpController.uploadFile);
// router.delete('/:id', authMiddleware, sftpController.deleteFile);
// router.delete('/soft-delete/:id', authMiddleware, userController.softDeleteUser);



module.exports = router;

