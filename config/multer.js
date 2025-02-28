// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, path.join(__dirname, '../uploads'));
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//         cb(null, `${uniqueSuffix}-${file.originalname}`);
//     },
// });

// const upload = multer({
//     storage,
//     limits: {
//         fileSize: 10 * 1024 * 1024, // 10MB limit
//     },
//     fileFilter: (req, file, cb) => {
//         const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
//         if (allowedMimeTypes.includes(file.mimetype)) {
//             cb(null, true);
//         } else {
//             cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
//         }
//     },
// });

// module.exports = upload;


// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, '../uploads'));
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//     cb(null, `${uniqueSuffix}-${file.originalname}`);
//   },
// });

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB limit
//     files: 5 // Maximum 5 files
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
//     if (allowedMimeTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
//     }
//   },
// });
// module.exports = upload;


const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define allowed attachable types
const allowedAttachableTypes = ['ticket', 'comments', 'sftp', 'organization', 'user'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            let type = req.body.attachableType?.toLowerCase() || 'misc';
            const organizationId = req.user.organization_id;
    
            console.log("multer.js: Attach type:", type);
    
            // Validate attachable type or fallback to 'misc'
            if (type === 'sftp') {
                const uploadPath =  path.join(__dirname, `../uploads/${organizationId}/sftp/input`);
                fs.mkdirSync(uploadPath, { recursive: true });
                cb(null, uploadPath);
                return;
            }
    
            if (!allowedAttachableTypes.includes(type)) {
                console.warn(`Invalid attachable type received: ${type}, defaulting to 'misc'`);
                type = 'misc'; 
            }
    
            const uploadPath = path.join(__dirname, `../uploads/${organizationId}/${type}`);
    
            // Ensure directory exists safely
            fs.mkdirSync(uploadPath, { recursive: true });
    
            cb(null, uploadPath);
        } catch (error) {
            console.error("Error in multer destination:", error);
            cb(new Error("File upload failed due to server error."), null);
        }    
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Max 5 files per request
    },
    fileFilter
});

// Export upload middleware
module.exports = upload;












// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Define allowed model types for attachments
// const ATTACHABLE_TYPES = {
//     'ticket': 'tickets',
//     'comment': 'comments',
//     'organization': 'organizations',
//     'user': 'users'
// };

// // Map mime types to categorize files when needed
// const MIME_TYPE_MAPPING = {
//     'image/jpeg': 'images',
//     'image/png': 'images',
//     'image/gif': 'images',
//     'application/pdf': 'documents',
//     'application/msword': 'documents',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'documents',
//     'application/vnd.ms-excel': 'spreadsheets',
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheets',
//     'text/plain': 'documents'
// };

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         try {
//             // Get attachableType from request
//             const attachableType = req.body.attachableType?.toLowerCase();
            
//             if (!attachableType || !ATTACHABLE_TYPES[attachableType]) {
//                 return cb(new Error('Invalid or missing attachableType. Must be one of: Ticket, Comment, Organization, User'));
//             }

//             // Create path structure: uploads/model_type/file_type
//             // Example: uploads/tickets/images/
//             const modelFolder = ATTACHABLE_TYPES[attachableType];
//             const fileTypeFolder = MIME_TYPE_MAPPING[file.mimetype] || 'misc';
//             const uploadPath = path.join(__dirname, `../uploads/${modelFolder}/${fileTypeFolder}`);
            
//             // Ensure directory exists
//             fs.mkdirSync(uploadPath, { recursive: true });
            
//             cb(null, uploadPath);
//         } catch (error) {
//             cb(new Error('Error creating upload directory'));
//         }
//     },
//     filename: (req, file, cb) => {
//         try {
//             // Create a unique filename with original extension
//             const fileExt = path.extname(file.originalname);
//             const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//             const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9]/g, '-');
            
//             cb(null, `${uniqueSuffix}-${sanitizedFilename}`);
//         } catch (error) {
//             cb(new Error('Error generating filename'));
//         }
//     }
// });

// const fileFilter = (req, file, cb) => {
//     const allowedMimeTypes = Object.keys(MIME_TYPE_MAPPING);

//     if (allowedMimeTypes.includes(file.mimetype)) {
//         cb(null, true);
//     } else {
//         cb(new Error(`Invalid file type. Allowed types are: ${allowedMimeTypes.join(', ')}`), false);
//     }
// };

// const upload = multer({
//     storage,
//     limits: {
//         fileSize: 10 * 1024 * 1024, // 10MB
//         files: 5 // Max 5 files per request
//     },
//     fileFilter
// });

// module.exports = {
//     upload,
//     ATTACHABLE_TYPES,
//     MIME_TYPE_MAPPING
// };