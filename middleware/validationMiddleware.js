const { body, validationResult } = require('express-validator');

// Validation middleware to handle and return validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Validation rules for user registration
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters long')
    .isAlphanumeric().withMessage('Username must be alphanumeric')
    .toLowerCase(),
  
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must include uppercase, lowercase, number, and special character'),
  
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('First name must be max 50 characters')
    .matches(/^[a-zA-Z\s]*$/).withMessage('First name can only contain letters'),
  
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Last name must be max 50 characters')
    .matches(/^[a-zA-Z\s]*$/).withMessage('Last name can only contain letters')
];

// Validation rules for login
const loginValidation = [
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Validation rules for profile update
const profileUpdateValidation = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('First name must be max 50 characters')
    .matches(/^[a-zA-Z\s]*$/).withMessage('First name can only contain letters'),
  
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Last name must be max 50 characters')
    .matches(/^[a-zA-Z\s]*$/).withMessage('Last name can only contain letters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
];

// Validation rules for password change
const passwordChangeValidation = [
  body('current_password')
    .notEmpty().withMessage('Current password is required'),
  
  body('new_password')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('New password must include uppercase, lowercase, number, and special character')
    .custom((value, { req }) => {
      if (value === req.body.current_password) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

// Validation rules for forgot password
const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
];

// Validation rules for password reset
const passwordResetValidation = [
  body('reset_token')
    .notEmpty().withMessage('Reset token is required'),
  
  body('new_password')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('New password must include uppercase, lowercase, number, and special character')
];

module.exports = {
  validateRequest,
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  passwordChangeValidation,
  forgotPasswordValidation,
  passwordResetValidation
};