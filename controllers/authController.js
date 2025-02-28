const User = require('../models/User');
const UserProduct = require('../models/UserProduct')
const { generateToken } = require('../config/jwt');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');



exports.register = async (req, res) => {


  try {
    const { username, email, password, role, organization_id } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({ username, email, password, role, organization_id });
    
    res.status(201).json({ 
      message: 'User registered successfully', 
      userId: user.id 
    });
  } catch (error) {
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Validation Error', 
        errors: error.errors.map(e => e.message) 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// exports.firstTimeLogin = async (req, res) => {
//   try {
//     const { email, temp_password, newPassword } = req.body;

//     // Find user
//     const user = await User.findOne({ where: { email } });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Verify temporary password
//     const istemp_passwordValid = await bcrypt.compare(temp_password, user.temp_password);
//     if (!istemp_passwordValid) {
//       return res.status(400).json({ message: 'Invalid temporary password' });
//     }

//     // Update password and clear temp password
//     const salt = await bcrypt.genSalt(10);
//     const hashedNewPassword = await bcrypt.hash(newPassword, salt);

//     await user.update({
//       password: hashedNewPassword,
//       temp_password: null
//     });

//     // Generate token
//     const token = generateToken(user);

//     res.json({
//       message: 'Password updated successfully',
//       token,
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Modify existing login route
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user
//     const user = await User.findOne({ where: { email } });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Check if this is a first-time login with temporary password
//     if (user.temp_password) {
//       return res.status(200).json({ 
//         requirePasswordChange: true,
//         message: 'Temporary password must be changed' 
//       });
//     }

//     // Regular password check
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Generate token
//     const token = generateToken(user);

//     res.json({
//       message: 'Login successful',
//       token,
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };



















exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if this is a first-time login with temporary password
    if (user.temp_password) {
      return res.status(200).json({ 
        requirePasswordChange: true,
        message: 'Temporary password must be changed' 
      });
    }

    // Regular password check
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Fetch product codes for the user
    const userProducts = await UserProduct.findAll({ 
      where: { user_id: user.id },
      attributes: ['product_code']
    });
    const productCodes = userProducts.map(up => up.product_code);

    // Generate token
    const token = generateToken(user, productCodes);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        productCodes,// Include product codes in the response
        IS_SFTP_USER: user.IS_SFTP_USER,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



exports.firstTimeLogin = async (req, res) => {
   try {
     // Log the entire request body for debugging
     console.log('Full request body:', req.body);

     const { email, temp_password, newPassword } = req.body;
     
     // Extensive logging
     console.log('Destructured values:', {
       email: email,
       temp_password: temp_password ? '[REDACTED]' : 'undefined',
       newPassword: newPassword ? '[REDACTED]' : 'undefined'
     });

     // Validate input types
     console.log('Input types:', {
       emailType: typeof email,
       temp_passwordType: typeof temp_password,
       newPasswordType: typeof newPassword
     });

     // Validate input
     if (!email || !temp_password || !newPassword) {
       return res.status(400).json({ 
         message: 'Missing required fields', 
         details: {
           email: !!email,
           temp_password: !!temp_password,
           newPassword: !!newPassword
         }
       });
     }

     // Find user
     const user = await User.findOne({ where: { email } });
     if (!user) {
       console.log('User not found for email:', email);
       return res.status(400).json({ message: 'Invalid credentials' });
     }

     // Additional logging for user record
     console.log('User record found:', {
       id: user.id,
       email: user.email,
       temp_password_exists: !!user.temp_password
     });

     // Verify temporary password
     let isTemp_passwordValid = false;
     try {
       // Add explicit type checking and conversion if needed
       const tempPasswordStr = String(temp_password);
       const storedTempPasswordStr = String(user.temp_password || '');

       console.log('Password comparison:', {
         inputTempPasswordType: typeof temp_password,
         storedTempPasswordType: typeof user.temp_password
       });

       isTemp_passwordValid = user.temp_password 
         ? await bcrypt.compare(tempPasswordStr, user.temp_password)
         : false;
     } catch (compareError) {
       console.error('Password compare error:', compareError);
       return res.status(500).json({ 
         message: 'Error verifying temporary password', 
         error: compareError.message 
       });
     }

     if (!isTemp_passwordValid) {
       console.log('Temporary password validation failed');
       return res.status(400).json({ message: 'Invalid temporary password' });
     }

     // Hash new permanent password
     const salt = await bcrypt.genSalt(10);
     console.log("newnewpasswordkya hai",newPassword)

     // Update user with new password and clear temp password
     await user.update({
       password: newPassword,
       temp_password: null
     });
     console.log("newpasswordkya hai",user.password)

     // Generate token
     const token = generateToken(user);

     res.json({
       message: 'Password updated successfully',
       token,
       user: {
         id: user.id,
         email: user.email,
         role: user.role,
         organization_id: user.organization_id
       }
     });
   } catch (error) {
     console.error('First-time login full error:', error);
     res.status(500).json({ 
       message: 'Server error', 
       error: error.message,
       stack: error.stack,
       details: error.toString()
     });
   }
};












const crypto = require('crypto');


exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.status(200).json({ 
        message: 'If a user with this email exists, they will receive password reset instructions.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour

    // Hash the reset token before saving
    const hashedResetToken = await bcrypt.hash(resetToken, 10);

    // Save reset token and expiry to user record
    await user.update({
      reset_token: hashedResetToken,
      reset_token_expiry: resetTokenExpiry
    });

    // Here you would typically send an email with the reset link
    // The link would contain the resetToken and point to your frontend reset page
    // sendResetEmail(user.email, resetToken);

    res.json({ 
      message: 'If a user with this email exists, they will receive password reset instructions.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          email: !!email,
          resetToken: !!resetToken,
          newPassword: !!newPassword
        }
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid reset request' });
    }

    // Verify token hasn't expired
    if (!user.reset_token_expiry || user.reset_token_expiry < new Date()) {
      return res.status(400).json({ 
        message: 'Password reset token has expired. Please request a new one.' 
      });
    }

    // Verify reset token
    const isValidToken = await bcrypt.compare(resetToken, user.reset_token);
    if (!isValidToken) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null
    });

    // Generate new auth token
    const token = generateToken(user);

    res.json({
      message: 'Password reset successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      }
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};