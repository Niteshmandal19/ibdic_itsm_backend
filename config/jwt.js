const jwt = require('jsonwebtoken');

const generateToken = (user, productCodes, ) => {
  return jwt.sign(
    { 
      id: user.id,
      first_name: user.first_name,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
      productCodes, // Add product codes to the token payload
      IS_SFTP_USER: user.IS_SFTP_USER
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};



const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error.name);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};