
// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');

// const Comment = sequelize.define('Comment', {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true
//   },
//   ticket_id: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     references: {
//       model: 'tickets',
//       key: 'id'
//     },
//     field: 'ticket_id'
//   },
//   user_id: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     references: {
//       model: 'users',
//       key: 'id'
//     },
//     field: 'user_id'
//   },
//   content: {
//     type: DataTypes.TEXT,
//     allowNull: false
//   },
//   created_at: {
//     type: DataTypes.DATE,
//     defaultValue: DataTypes.NOW
//   },
//   is_internal: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: false
//   },
//   type: {
//     type: DataTypes.ENUM('internal', 'open', 'system', 'status_change', 'assignee_change'),
//     allowNull: false
//   },
//   attachment: {
//     type: DataTypes.STRING,
//     allowNull: true
//   },
//   attachmentOriginalName: {
//     type: DataTypes.STRING,
//     allowNull: true
//   },
//   attachmentType: {
//     type: DataTypes.STRING,
//     allowNull: true
//   }
// }, {
//   sequelize,
//   tableName: 'comments',
//   timestamps: false,
//   underscored: true,
// });

// Comment.associate = (models) => {
//   Comment.belongsTo(models.Ticket, {
//     foreignKey: 'ticket_id',
//     as: 'ticket'
//   });
  
//   Comment.belongsTo(models.User, {
//     foreignKey: 'user_id',
//     as: 'user'
//   });
  
//   Comment.hasMany(models.Attachment, {
//     foreignKey: 'attachableId',
//     constraints: false,
//     scope: {
//       attachableType: 'Comment'
//     },
//     as: 'attachments'
//   });

// };

// module.exports = Comment;



const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tickets',
      key: 'id'
    }
  },
  parent_id: {  // New field for nested comments
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_internal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  type: {
    type: DataTypes.ENUM('internal', 'open', 'system', 'status_change', 'assignee_change', 'reply'),
    allowNull: false
  },
  attachment: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attachmentOriginalName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attachmentType: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'comments',
  timestamps: false,
  underscored: true,
});

Comment.associate = (models) => {
  Comment.belongsTo(models.Ticket, {
    foreignKey: 'ticket_id',
    as: 'ticket'
  });
  
  Comment.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  // Add associations for nested comments
  Comment.belongsTo(Comment, {
    foreignKey: 'parent_id',
    as: 'parent'
  });
  
  Comment.hasMany(Comment, {
    foreignKey: 'parent_id',
    as: 'replies'
  });
  
  Comment.hasMany(models.Attachment, {
    foreignKey: 'attachableId',
    constraints: false,
    scope: {
      attachableType: 'Comment'
    },
    as: 'attachments'
  });
};

module.exports = Comment;