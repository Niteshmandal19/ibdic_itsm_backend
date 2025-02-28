const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProduct = sequelize.define(
  'UserProduct',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    tableName: 'user_products',
    timestamps: false, // Use this if created_at is handled manually
  }
);

UserProduct.associate = (models) => {
  UserProduct.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
  });

  UserProduct.belongsTo(models.ProductMaster, {
    foreignKey: 'product_code',
    targetKey: 'product_code',
    as: 'product',
  });
};

module.exports = UserProduct;
