const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const {
    createProduct,
    getAllProducts,
    deleteProduct,
    updateProduct
  } = require('../controllers/productController');
const LevelsIssueType = require('../models/LevelsIssueType');
const ProductMaster = require('../models/ProductMaster');
  
  

// Get all 
router.get('/', authMiddleware, getAllProducts);

// Create a new product
router.post('/', authMiddleware, createProduct);

// Update a new product
router.put('/:id', authMiddleware, updateProduct);

// Delete a product (soft delete)
router.delete('/:id', authMiddleware, deleteProduct);



// level Management

// router.get("/projects", async (req, res) => {
//   try {
//     const products = await ProductMaster.findAll({
//       attributes: ["project_code", "product_name"],
//     });
//     res.status(200).json(products);
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     res.status(500).json({ error: "Failed to fetch products." });
//   }
// });



module.exports = router;