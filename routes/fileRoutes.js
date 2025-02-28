// const express = require('express');
// const router = express.Router();
// const { processCSV } = require('../controllers/fileController');

// router.post('/process', processCSV);

// module.exports = router;



const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const FileController = require('../controllers/fileController');

const fileController = new FileController();

router.post('/process', fileController.processFile.bind(fileController));
router.get('/errors/:errorFileName', fileController.getErrorLog.bind(fileController));
router.post('/upload', upload.single('file'), fileController.uploadFile.bind(fileController));

module.exports = router;