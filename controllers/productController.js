const ProductMaster = require('../models/ProductMaster');
const { Op } = require('sequelize');



const getAllProducts = async (req, res) => {
  try {
    const { organization_id, productCodes } = req.user;

    if (!productCodes || productCodes.length === 0) {
      return res.status(400).json({
        message: 'No product codes found for the user.',
      });
    }

    // Construct filter conditions
    const whereCondition = {
      status: 1, // Only get active products
      ...(organization_id !== 'IBDIC' && { organization_id }), // Filter by organization_id if not IBDIC
      product_code: { [Op.in]: productCodes }, // Filter by user's productCodes
    };

    const products = await ProductMaster.findAll({
      where: whereCondition,
      order: [['created_at', 'DESC']],
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
};



// Create a new product
const createProduct = async (req, res) => {
  try {
    const { product_code, product_name } = req.body;

    // Use user ID from authMiddleware
    const created_by = `${req.user.first_name} ${req.user.last_name}`;


    // Check if product code already exists
    const existingProduct = await ProductMaster.findOne({
      where: { product_code },
    });

    if (existingProduct) {
      return res.status(400).json({ error: 'Product code already exists' });
    }

    const product = await ProductMaster.create({
      product_code,
      product_name,
      created_by, // Set created_by using req.user
      created_at: new Date(),
      updated_at: new Date(),
      status: 1,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};



const updateProduct = async (req, res) => {
        try {
          const { id } = req.params;
          const { product_code, product_name, status } = req.body;
    
          // Check if product exists
          const product = await ProductMaster.findByPk(id);
          
          if (!product) {
            return res.status(404).json({ error: 'Product not found' });
          }
    
          // Check if new product code already exists (if it's being changed)
          if (product_code !== product.product_code) {
            const existingProduct = await ProductMaster.findOne({
              where: { product_code }
            });
    
            if (existingProduct) {
              return res.status(400).json({ error: 'Product code already exists' });
            }
          }
          const updated_by = `${req.user.first_name} ${req.user.last_name}`;
    
          await product.update({
            product_code,
            product_name,
            status: parseInt(status),
            updated_by, // Replace with actual user info
            updated_at: new Date()
          });
          
          res.json(product);
        } catch (error) {
          res.status(500).json({ error: 'Failed to update product' });
        }
      }
    
// Soft delete a product
const deleteProduct = async (req, res) => {
    try {
        const product = await ProductMaster.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
          }
      
        await product.destroy();
        res.status(200).json({ message: 'product deleted successfully' });
      } catch (error) {
        console.error('Error in deleteproduct:', error);
        res.status(500).json({ message: 'Error deleting product' });
      }
};

module.exports = {
  getAllProducts,
  createProduct,
  deleteProduct,
  updateProduct
};
