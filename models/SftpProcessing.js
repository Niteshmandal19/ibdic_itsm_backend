const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

  const SftpProcessing = sequelize.define('SftpProcessing', {
    file_name: {
      type: DataTypes.STRING(255),
      primaryKey: true
    },
    status: {
      type: DataTypes.ENUM('Input', 'Output', 'Delivered', 'Failed'),
      allowNull: false
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    downloaded_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    downloaded_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'sftp_processing',
    timestamps: false
  });

  // Associations
  SftpProcessing.associate = (models) => {
    SftpProcessing.belongsTo(models.User, { 
      as: 'uploader', 
      foreignKey: 'uploaded_by' 
    });
    SftpProcessing.belongsTo(models.User, { 
      as: 'downloader', 
      foreignKey: 'downloaded_by' 
    });
  };


module.exports = SftpProcessing