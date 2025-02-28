const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const Comment = require('./Comment');
// const Ticket = require('./Ticket');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Invalid email address',
        },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue:'12345678',
      validate: {
        len: {
          args: [6, 255],
          msg: 'Password must be at least 6 characters long',
        },
      },
    },
    role: {
      type: DataTypes.ENUM('IBDIC_ADMIN', 'IBDIC_USER', 'ORG_ADMIN', 'ORG_USER'),
      allowNull: false,
      defaultValue: 'IBDIC_ADMIN',
      validate: {
        isIn: {
          args: [['IBDIC_ADMIN', 'IBDIC_USER', 'ORG_ADMIN', 'ORG_USER']],
          msg: 'Invalid role selected',
        },
      },
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    identifier_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    identifier: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    mobile_no: {
      type: DataTypes.STRING(12),
      allowNull: true,
    },
    organization_id: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    // Add virtual field for ticket count
    ticketCount: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.assignedTickets ? this.assignedTickets.length : 0;
      }
    },
    temp_password: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    IS_SFTP_USER: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }
  },
  {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        try {
          // Hash the password if it exists
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(String(user.password), salt);
          }
          
          // Hash the temporary password if it exists
          if (user.temp_password) {
            const salt = await bcrypt.genSalt(10);
            user.temp_password = await bcrypt.hash(String(user.temp_password), salt);
          }
        } catch (error) {
          console.error('Error in beforeCreate hook:', error);
          throw error;
        }
      },
      beforeUpdate: async (user, options) => {
        try {
          // Hash password if changed and not already hashed
          if (user.changed('password')) {
            // Add a simple check to see if it's already hashed
            if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
              const salt = await bcrypt.genSalt(10);
              user.password = await bcrypt.hash(String(user.password), salt);
            }
          }
          
          // Hash temporary password if changed and not already hashed
          if (user.changed('temp_password') && user.temp_password) {
            if (!user.temp_password.startsWith('$2a$') && !user.temp_password.startsWith('$2b$')) {
              const salt = await bcrypt.genSalt(10);
              user.temp_password = await bcrypt.hash(String(user.temp_password), salt);
            }
          }
        } catch (error) {
          console.error('Error in beforeUpdate hook:', error);
          throw error;
        }
      }
    },
  }
);

// Add the comparePassword method to the prototype
User.prototype.comparePassword = async function (inputPassword) {
  return this.password ? await bcrypt.compare(inputPassword, this.password) : false;
};
// Add an associate method if needed
// User.associate = (models) => {
//   User.hasMany(models.User, {
//     foreignKey: 'userId',
//     as: 'comment'
//   });
  
// };

// User.associate = (models) => {
//   // Ensure the association is defined correctly
//   User.hasMany(models.Comment, {
//     foreignKey: 'userId', // Make sure this matches the column name in the Comment model
//     as: 'comments'
//   });

//   // Your existing ticket associations
//   User.hasMany(models.Ticket, {
//     foreignKey: 'organization_id',
//   });
//   User.hasMany(models.Ticket, {
//       foreignKey: 'assignee',
//       as: 'assignedTo'
//   });
  
//   User.hasMany(models.Ticket, {
//     foreignKey: 'created_by',
//     as: 'creator'
//   });
// };
User.associate = (models) => {
  // Ticket assignments
  User.hasMany(models.Ticket, {
    foreignKey: 'assignee',
    as: 'assignedTickets',
    constraints: true,
    onDelete: 'SET NULL'
  });

  // Tickets created by user
  User.hasMany(models.Ticket, {
    foreignKey: 'created_by',
    as: 'createdTickets',
    constraints: true
  });

  // Organization's tickets
  User.hasMany(models.Ticket, {
    foreignKey: 'organization_id',
    sourceKey: 'organization_id',
    as: 'organizationTickets',
    constraints: true
  });

  // Comments
  User.hasMany(models.Comment, {
    foreignKey: 'userId',
    as: 'comments'
  });

  User.hasMany(models.SftpProcessing, {
    foreignKey: 'uploaded_by',
    as: 'uploadedFiles',
    constraints: true
  });

  User.hasMany(models.SftpProcessing, {
    foreignKey: 'downloaded_by',
    as: 'downloadedFiles',
    constraints: true
  });


};


module.exports = User;