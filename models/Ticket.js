const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Comment = require('./Comment');
const HasAttachments = require('./mixins/HasAttachments');


const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Title cannot be empty"
            },
            len: {
                args: [3, 255],
                msg: "Title must be between 3 and 255 characters"
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Description cannot be empty"
            },
            len: {
                args: [10, 5000],
                msg: "Description must be between 10 and 5000 characters"
            }
        }
    },
    project: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Project name cannot be empty"
            }
        }
    },
    issueType: {
        type: DataTypes.ENUM('Bug', 'Feature', 'Enhancement', 'Task', 'Support'),
        allowNull: false
    },
    requestType: {
        type: DataTypes.ENUM('Internal', 'External', 'Urgent', 'Routine'),
        allowNull: false
    },
    // assignee: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true, // Make assignee optional
    //     references: {
    //         model: 'Users',
    //         key: 'id'
    //     }
    // },
    priority: {
        type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
        allowNull: false,
        defaultValue: 'Medium'
    },
    impact: {
        type: DataTypes.ENUM('Minimal', 'Moderate', 'Significant', 'Severe'),
        allowNull: false,
        defaultValue: 'Moderate'
    },
    status: {
        type: DataTypes.ENUM('Open', 'In Progress', 'Resolved', 'Closed', 'On Hold'),
        defaultValue: 'Open'
    },
    // created_by: {
    //     type: DataTypes.STRING(50),
    //     references: {
    //         model: 'Users',
    //         key: 'username'
    //     },
    //     allowNull: false
    // },
    // attachment: {
    //     type: DataTypes.STRING(500),
    //     allowNull: true,
    //     validate: {
    //         isValidPath(value) {
    //             if (value && value.length > 500) {
    //                 throw new Error('Attachment path is too long');
    //             }
    //         }
    //     }
    // },
    // attachmentOriginalName: {
    //     type: DataTypes.STRING(255),
    //     allowNull: true
    // },
    resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    createdTimestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    // organization_id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true,
    //     references: {
    //         model: 'Users',
    //         key: 'organization_id'
    //     }
    // }
    assignee: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    created_by: {
        type: DataTypes.STRING(50),
        references: {
            model: 'users',
            key: 'id'
        },
        allowNull: false
    },
    organization_id: {
        type: DataTypes.STRING(15),  // Changed to match User model
        allowNull: true,
        references: {
            model: 'users',
            key: 'organization_id'
        }
    },
    // In your Ticket model definition
    previousStatus: {
        type: DataTypes.STRING,
        allowNull: true
    }

}, {
    tableName: 'tickets',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['created_by'] },
        { fields: ['assignee'] },
        { fields: ['organization_id'] } // Index for organization_id
    ]
});

Object.assign(Ticket, HasAttachments);


Ticket.associate = (models) => {
    Ticket.belongsTo(models.User, {
        foreignKey: 'created_by',
        targetKey: 'id',
        as: 'creator'
    });

    Ticket.belongsTo(models.User, {
        foreignKey: 'assignee',
        targetKey: 'id',  // Add this line
        as: 'assignedTo'
    });

    Ticket.belongsTo(models.User, {
        foreignKey: 'organization_id',
        targetKey: 'organization_id',
        as: 'organization'
    });

    Ticket.hasMany(models.Comment, {
        foreignKey: 'ticketId',
        as: 'comments'
    });

    Ticket.hasAttachments(models);  
};


module.exports = Ticket;
