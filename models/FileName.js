const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path based on your project structure

const FileName = sequelize.define('file_names', {
    file_name_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    file_name_API: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    file_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: 'file_names',
    timestamps: false // Disable createdAt and updatedAt fields
});

module.exports = FileName;
