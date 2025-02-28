// const { verifyToken } = require('../config/jwt');
// const User = require('../models/User');

// const authMiddleware = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   console.log("AUTHMIDDLEWARE,Received request body:", req.body);
//   console.log("authmiddleware:",req.body)
 
//   if (!authHeader) {
//     return res.status(401).json({ message: 'No token provided' });
//   }

//   const token = authHeader.split(' ')[1];
//   try {
//     const decoded = verifyToken(token);
//     if (!decoded) {
//       return res.status(401).json({ message: 'Invalid or expired token' });
//     }
//     const user = await User.findByPk(decoded.id, {
//       attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'organization_id']
//     });
//     console.log("authMIddlesware for user:",user);

//     if (!user) {
//       return res.status(401).json({ message: 'User not found' });
//     }
//     // Attach user AND organization_id to the request
//     req.user = {
//       ...user.toJSON(),
//       organization_id: user.organization_id
//     };
    

//     // If the route is for creating a ticket, allow it for any authenticated user
//     if (req.path.includes('/tickets') && req.method === 'POST') {
//       return next();
//     }
//     if (req.path.includes('/products') && req.method === 'POST') {
//       return next();
//     }
//     if (req.path.includes('/users') && req.method === 'POST') {
//       return next();
//     }
//     if (req.path.includes('/auth') && req.method === 'POST') {
//       return next();
//     }
//     if (req.path.includes('/organization') && req.method === 'POST') {
//       return next();
//     }

//     // You might want to keep role-based access for other routes
//     // This part depends on your specific authorization requirements
//     next();
//   } catch (error) {
//     console.error('Authentication error:', error);
//     res.status(401).json({ 
//       message: 'Authentication failed', 
//       error: error.message 
//     });
//   }
// };

// module.exports = authMiddleware;


const { verifyToken } = require('../config/jwt');
const User = require('../models/User');
const UserProduct = require('../models/UserProduct');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided or invalid token format' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findByPk(decoded.id, {
      attributes: [
        'id', 
        'first_name', 
        'last_name', 
        'email', 
        'role', 
        'organization_id',
        'IS_SFTP_USER'
      ]
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const userProducts = await UserProduct.findAll({
      where: { user_id: user.id },
      attributes: ['product_code']
    });

    req.user = {
      ...user.toJSON(),
      productCodes: userProducts.map(up => up.product_code)
    };

    console.log('Authenticated User:', req.user); // Debug log

    if (!req.user.productCodes || req.user.productCodes.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No product codes found for the user.' 
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
