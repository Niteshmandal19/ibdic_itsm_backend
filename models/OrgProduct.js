const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrgProduct = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    organization_id: {
        type: DataTypes.STRING(15),
        allowNull: true,
        references: {
            model: 'org_master',
            key: 'organization_id'
        }
    },
    product_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    product_code: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    price: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    billingType: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    billingMethod: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    discounting: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    created_by: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    updated_by: {
        type: DataTypes.STRING(100),
        allowNull: true
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
    tableName: 'org_products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = OrgProduct;
