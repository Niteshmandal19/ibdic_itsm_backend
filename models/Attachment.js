const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attachment = sequelize.define('Attachment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    attachableId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the parent record (ticket, comment, org, user)'
    },
    attachableType: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Name of the parent model (Ticket, Comment, Organization, User)'
    },
    filePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 500]
        }
    },
    originalName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'attachments',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['attachableId', 'attachableType'] },
        { fields: ['uploadedBy'] }
    ]
});

Attachment.associate = (models) => {
    Attachment.belongsTo(models.User, {
        foreignKey: 'uploadedBy',
        as: 'uploader'
    });
    Attachment.belongsTo(models.Comment, {
        foreignKey: 'attachableId',
        constraints: false,
        as: 'comment'
      });
    
};

module.exports = Attachment;