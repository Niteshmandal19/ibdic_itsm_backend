// models/IssueType.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IssueType = sequelize.define('IssueType', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    label: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        field: 'is_active',
        defaultValue: true,
    },
}, {
    tableName: 'issue_types',
    timestamps: false,
});

IssueType.getAll = async function () {
    try {
        return await IssueType.findAll({
            where: { isActive: true },
            attributes: ['id', 'value', 'label', 'description'],
        });
    } catch (error) {
        throw new Error('Error fetching issue types: ' + error.message);
    }
};

IssueType.getById = async function (id) {
    try {
        return await IssueType.findOne({
            where: { id, isActive: true },
            attributes: ['id', 'value', 'label', 'description'],
        });
    } catch (error) {
        throw new Error('Error fetching issue type: ' + error.message);
    }
};

module.exports = IssueType;