// const express = require('express');
// const router = express.Router();
// const authMiddleware = require('../middleware/authMiddleware');
// const orgController = require('../controllers/orgController');
// const { createOrgMaster } = require('../controllers/orgController'); // Correct singular import

// // Create OrgMaster route
// router.post('/create-org-master', 
//   authMiddleware, // Middleware for authentication
//   createOrgMaster  // Controller function
// );


// // Product routes
// router.post('/create-product', orgController.createProduct);
// router.get('/products/:orgId', orgController.getProductsByOrgId);

// // Signatory routes
// router.post('/create-signatory', orgController.createSignatory);
// router.get('/signatories/:orgId', orgController.getSignatoriesByOrgId);

// module.exports = router;

// module.exports = router;









const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const orgController = require('../controllers/orgController');
const { createOrgMaster } = require('../controllers/orgController');
const upload = require('../config/multer');


// Existing routes
router.post('/create-org-master', authMiddleware, upload.single('attachment'), createOrgMaster);
router.post('/create-product/:orgId', orgController.createProduct);
router.post('/create-signatory/:orgId', orgController.createSignatory);

// New routes for management
router.get('/list', authMiddleware, orgController.listOrganizations);
router.put('/update/:orgId', authMiddleware, orgController.updateOrganization);
router.put('/update-products/:orgId', authMiddleware, orgController.updateProducts);
router.put('/update-signatories/:id', authMiddleware, orgController.updateSignatories);
router.delete('/soft-delete/:orgId', authMiddleware, orgController.softDeleteOrganization);

// Product and Signatory routes remain the same
router.get('/products/:orgId', authMiddleware, orgController.getProductsByOrgId);
router.get('/signatories/:orgId', authMiddleware, orgController.getSignatoriesByOrgId);
router.delete('/delete-product/:Id', authMiddleware, orgController.softDeleteProduct);
router.delete('/delete-signatory/:Id', authMiddleware, orgController.softDeleteSignatory);

// In your routes file
router.get('/:id', authMiddleware, orgController.getOrganizationById);
router.get('/attachment/:id', authMiddleware, orgController.getAttachment);

module.exports = router;