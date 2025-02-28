const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SignatoryProduct = sequelize.define(
  'SignatoryProduct',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    signatory_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'org_signatories',
        key: 'id',
      },
    },
    product_code: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'product_master',
        key: 'product_code',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: 'signatory_products',
    timestamps: false, // Since we're handling created_at manually
  }
);

SignatoryProduct.associate = (models) => {
  SignatoryProduct.belongsTo(models.Signatory, {
    foreignKey: 'signatory_id',
    as: 'signatory',
  });

  SignatoryProduct.belongsTo(models.ProductMaster, {
    foreignKey: 'product_code',
    targetKey: 'product_code',
    as: 'product',
  });
};

module.exports = SignatoryProduct;