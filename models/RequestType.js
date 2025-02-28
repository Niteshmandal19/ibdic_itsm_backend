// models/RequestType.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RequestType = sequelize.define('RequestType', {
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
    tableName: 'request_types',
    timestamps: false,
});

RequestType.getAll = async function () {
    try {
        return await RequestType.findAll({
            where: { isActive: true },
            attributes: ['id', 'value', 'label', 'description'],
        });
    } catch (error) {
        throw new Error('Error fetching request types: ' + error.message);
    }
};

RequestType.getById = async function (id) {
    try {
        return await RequestType.findOne({
            where: { id, isActive: true },
            attributes: ['id', 'value', 'label', 'description'],
        });
    } catch (error) {
        throw new Error('Error fetching request type: ' + error.message);
    }
};

module.exports = RequestType;