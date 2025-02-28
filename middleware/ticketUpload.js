const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the upload directory path
    const uploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'tickets');
    
    // Create directory if it doesn't exist
    try {
      if (!fs.existsSync(uploadDir)) {
        // Use recursive: true to create nested directories if needed
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
    
    // Tell Multer where to store the files
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    cb(null, `ticket-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // File type validation
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG, PDF, and GIF are allowed.'), false);
    }
  }
});

module.exports = upload;