// const sequelize = require('../config/database');
// const User = require('../models/User');
// const path = require('path');
// const Ticket = require('../models/Ticket');
const { User, Ticket, sequelize } = require('../models/index');
const { Op } = require('sequelize');
const OrgMaster = require('../models/OrgMaster');
const UserProduct = require('../models/UserProduct');


const getUserProfile = async (req, res) => {
  try {
    // Verify that req.user exists
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    // Destructure user data from req.user
    const { id, email, role, organization_id, first_name, last_name } = req.user;

    // Query UserProduct to get user's product codes
    const userProducts = await UserProduct.findAll({
      where: { user_id: id },
      attributes: ['product_code']
    });

    const product_codes = userProducts.map(product => product.product_code);

    // Send response with user profile data
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        id,
        email,
        first_name,
        last_name,
        role,
        organization_id,
        product_codes
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve user profile',
      error: error.message || 'Internal server error'
    });
  }
};



const getAssignee = async (req, res) => {
  try {
    // Fetch users from the specified organization
    const users = await User.findAll({
      where: {
        organization_id: "IBDIC"
      },
      attributes: [
        'id',
        'first_name',
        'last_name',
        'email',
        'role',
        'organization_id'
      ],
      order: [
        ['first_name', 'ASC'],
        ['last_name', 'ASC']
      ]
    });

    res.json({
      message: 'Users fetched successfully',
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      message: 'Failed to fetch users',
      error: 'Internal server error'
    });
  }
};



const getUserDetailByOrganization = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const whereCondition = 
      organizationId === "IBDIC" 
        ? {} // No filter for "IBDIC"
        : { organization_id: organizationId }; // Filter by organization_id



    const users = await User.findAll({
      where: whereCondition,
      attributes: [
        'id',
        'first_name',
        'last_name',
        'email',
        'mobile_no',
        'role',
        'organization_id',
        'identifier_type',
        'identifier',
        'IS_SFTP_USER',
        'status',
        [
          sequelize.literal(`(
              SELECT COUNT(*)
              FROM tickets
              WHERE tickets.assignee = User.id
              AND tickets.status != 'Closed'
              AND tickets.deletedAt IS NULL
            )`),
          'ticket_count'
        ],
        [
          sequelize.literal(`(
              SELECT COUNT(*)
              FROM tickets
              WHERE tickets.assignee = User.id
              AND tickets.status = 'Resolved'
              AND tickets.deletedAt IS NULL
            )`),
          'resolved_tickets'
        ],
        [sequelize.fn('date_format', sequelize.col('User.createdAt'), '%Y-%m-%d'), 'date_created']
      ],
      include: [
        {
          model: Ticket,
          as: 'assignedTickets',
          attributes: [],
          required: false,
          where: {
            status: {
              [Op.ne]: 'Closed'
            }
          }
        }
      ],
      order: [
        ['organization_id', 'ASC'],
        ['first_name', 'ASC'],
        ['last_name', 'ASC']
      ]
    });

    // Transform data to match frontend expectations
    const transformedUsers = users.map(user => {
      const plainUser = user.get({ plain: true });
      return {
        ...plainUser,
        ticket_assigned: plainUser.ticket_count || 0,
        ticket_resolved: plainUser.resolved_tickets || 0
      };
    });

    res.status(200).json(transformedUsers);
  } catch (error) {
    console.error('Error in getUsersByOrganization:', error);
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
};





// const createUser = async (req, res) => {
//   const transaction = await sequelize.transaction();

//   try {
//     // Destructure input data
//     const {
//       first_name,
//       last_name,
//       identifier_type,
//       identifier,
//       email,
//       mobile_no,
//       temp_password, // Now receiving from frontend
//       role,
//       organization_id,
//     } = req.body;

//     // Validate input
//     const validationErrors = [];
//     if (!first_name) validationErrors.push('First name is required');
//     if (!last_name) validationErrors.push('Last name is required');
//     if (!email) validationErrors.push('Email is required');
//     if (!mobile_no) validationErrors.push('Mobile number is required');
//     if (!role) validationErrors.push('Role is required');
//     if (!temp_password) validationErrors.push('Temporary password is required');

//     if (validationErrors.length > 0) {
//       return res.status(400).json({
//         message: 'Validation failed',
//         errors: validationErrors
//       });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const created_by = req.user.id;

//     // Prepare user data
//     const userData = {
//       first_name,
//       last_name,
//       identifier_type,
//       identifier,
//       email,
//       mobile_no,
//       role,
//       temp_password, // Using the frontend-provided temp password
//       organization_id,
//       created_by,
//       password: null, // No initial password
//     };

//     // Create user within transaction
//     const newUser = await User.create(userData, { transaction });

//     // Commit transaction
//     await transaction.commit();

//     // Prepare response (exclude sensitive information)
//     const userResponse = {
//       id: newUser.id,
//       first_name: newUser.first_name,
//       last_name: newUser.last_name,
//       email: newUser.email,
//       role: newUser.role,
//       organization_id: newUser.organization_id,
//     };

//     res.status(201).json({
//       message: 'User created successfully',
//       user: userResponse
//     });

//   } catch (error) {
//     // Rollback transaction in case of error
//     await transaction.rollback();

//     console.error('User creation error:', error);

//     // Handle specific error types
//     if (error.name === 'SequelizeUniqueConstraintError') {
//       return res.status(409).json({
//         message: 'User creation failed',
//         error: 'A user with this unique identifier already exists'
//       });
//     }

//     // Generic server error
//     res.status(500).json({
//       message: 'Failed to create user',
//       error: 'Internal server error'
//     });
//   }
// };


// In your user creation API handler using Sequelize


const jwt = require('jsonwebtoken');
const createUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      first_name,
      last_name,
      identifier_type,
      identifier,
      email,
      mobile_no,
      temp_password,
      role,
      organization_id,
      IS_SFTP_USER,
      product_codes
    } = req.body;

    // Validation
    const validationErrors = [];
    if (!first_name) validationErrors.push('First name is required');
    if (!last_name) validationErrors.push('Last name is required');
    if (!email) validationErrors.push('Email is required');
    if (!mobile_no) validationErrors.push('Mobile number is required');
    if (!role) validationErrors.push('Role is required');
    if (!temp_password) validationErrors.push('Temporary password is required');
    if (!organization_id) validationErrors.push('Organization ID is required');

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { email },
      transaction 
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const newUser = await User.create({
      first_name,
      last_name,
      identifier_type,
      identifier,
      email,
      mobile_no,
      role,
      temp_password,
      organization_id,
      IS_SFTP_USER,
      created_by: req.user?.id || 'SYSTEM',
      password: null // Will be set when user first logs in
    }, { transaction });

    // Create product associations
    if (product_codes?.length > 0) {
      await Promise.all(product_codes.map(code =>
        UserProduct.create({
          user_id: newUser.id,
          product_code: code,
          created_by: req.user?.id || 'SYSTEM'
        }, { transaction })
      ));
    }

    // Generate token with all necessary data
    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      organization_id: newUser.organization_id,
      product_codes: product_codes || [],
      IS_SFTP_USER: newUser.IS_SFTP_USER
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await transaction.commit();

    // Send response
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: newUser.id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email,
          role: newUser.role,
          organization_id: newUser.organization_id,
          product_codes: product_codes || [],
          IS_SFTP_USER: newUser.IS_SFTP_USER,
        },
        token
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('User creation error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};





const getOrganizations = async (req, res) => {
  try {
    console.log('Attempting to fetch organizations...');
    const organizationId = req.user.organization_id;
    const whereCondition = 
      organizationId === "IBDIC" 
        ? {} // No filter for "IBDIC"
        : { organization_id: organizationId }; // Filter by organization_id

    const organizations = await OrgMaster.findAll({
      where: whereCondition,
      attributes: ['organization_id', 'org_name'],
      order: [['organization_id', 'ASC']],
    });
    console.log('Organizations fetched:', organizations);

    res.status(200).json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations'
    });
  }
};

// const getOrganizations = async (req, res) => {
//   try {
//     console.log('Attempting to fetch organizations...:', user);
//     const { organization_id: userOrgId, role: userRole } = req.user;

//     let organizations;
//     if (userRole === 'ADMIN' && userOrgId === 'IBDIC') {
//       // Admin of IBDIC can view all organizations
//       organizations = await OrgMaster.findAll({
//         attributes: ['organization_id', 'org_name'],
//         order: [['organization_id', 'ASC']],
//       });
//     } else {
//       // Non-admin or not part of IBDIC, fetch only their organization
//       organizations = await OrgMaster.findAll({
//         where: { organization_id: userOrgId },
//         attributes: ['organization_id', 'org_name'],
//       });
//     }

//     console.log('Organizations fetched:', organizations);

//     res.status(200).json({
//       success: true,
//       data: organizations,
//     });
//   } catch (error) {
//     console.error('Error fetching organizations:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch organizations',
//     });
//   }
// };




const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    
    // Check authorization
    if (currentUser.role !== 'IBDIC_ADMIN' && 
        currentUser.role !== 'ORG_ADMIN' && 
        currentUser.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Not authorized to view this user' });
    }
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'temp_password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If org admin, check if user belongs to same organization
    if (currentUser.role === 'ORG_ADMIN' && 
        user.organization_id !== currentUser.organization_id) {
      return res.status(403).json({ message: 'Not authorized to view this user' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
}

// Update user
const updateUser =  async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const updates = req.body;

    // Get user to update
    const userToUpdate = await User.findByPk(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization
    if (currentUser.role !== 'IBDIC_ADMIN' && 
        (currentUser.role !== 'ORG_ADMIN' || userToUpdate.organization_id !== currentUser.organization_id) && 
        currentUser.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Restrict fields that can be updated
    const allowedUpdates = ['first_name', 'last_name', 'mobile_no', 'identifier_type', 'identifier', 'status', 'IS_SFTP_USER'];
    
    // Additional fields for admins
    if (currentUser.role === 'IBDIC_ADMIN' || 
        (currentUser.role === 'ORG_ADMIN' && userToUpdate.organization_id === currentUser.organization_id)) {
      allowedUpdates.push('role', 'organization_id');
    }

    // Filter out non-allowed updates
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    // Perform update
    await userToUpdate.update(filteredUpdates);

    // Fetch updated user
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password', 'temp_password'] }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
}

// Delete user
const deleteUser=  async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Only IBDIC_ADMIN can delete users
    if (currentUser.role !== 'IBDIC_ADMIN') {
      return res.status(403).json({ message: 'Only IBDIC administrators can delete users' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ status: 0 });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
}

// userController.js
// const softDeleteUser = async (req, res) => {
//   try {
//     const userId = req.params.Id;
//     console.log('User ID:', userId);
    
//     // First, get the current user to check their status
//     const user = await User.findByPk(userId);
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     console.log('Current Status:', user.status);

//     // Toggle the status
//     const newStatus = user.status === 1 ? 0 : 1;
//     console.log('New Status:', newStatus);
    
//     // Update the user's status
//     await user.update({ status: newStatus });

//     console.log('Updated Status:', user.status);  // Check if status is updated

//     return res.status(200).json({ 
//       message: `User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
//       status: newStatus 
//     });
//   } catch (error) {
//     console.error('Error in softDeleteUser:', error);
//     return res.status(500).json({ 
//       message: 'Failed to update user status',
//       error: error.message 
//     });
//   }
// };



module.exports = {
  getUserProfile,
  getOrganizations,
  getAssignee,
  getUserDetailByOrganization,
  createUser,
  updateUser,
  deleteUser,
  getUserById
  // softDeleteUser
};