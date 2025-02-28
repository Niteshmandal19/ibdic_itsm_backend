// models/Signatory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrgSignatory = sequelize.define('Signatory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    organization_id: {
        type: DataTypes.STRING(15),
        allowNull: false,
        references: {
            model: 'org_master',
            key: 'organization_id'
        }
    },
    name: {
        type: DataTypes.STRING(80),
        allowNull: false
    },
    designation: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    pan_no: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    email_id: {
        type: DataTypes.STRING(45),
        allowNull: false
    },
    mobile_no: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    status: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    date_of_mobile_conf: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    date_of_email_conf: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    date_creation: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'org_signatories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = OrgSignatory;