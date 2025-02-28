const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path as per your project structure

const ProductMaster = sequelize.define(
  'ProductMaster',
  {
    product_code: {
      type: DataTypes.STRING(255), // Adjusted to STRING for better flexibility with product codes
      primaryKey: true,
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_by: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1, // Active by default
      validate: {
        isIn: [[0, 1]], // Ensures value is either 0 (Inactive) or 1 (Active)
      },
    },
  },
  {
    tableName: 'product_master', // Name of the table in the database
    timestamps: false, // Disables Sequelize's automatic timestamps (createdAt, updatedAt)
    underscored: true, // Maps snake_case in DB to camelCase in JS
  }
);

// Add an associate method for defining relationships
ProductMaster.associate = (models) => {
  ProductMaster.hasMany(models.UserProduct, {
    foreignKey: 'product_code',
    sourceKey: 'product_code',
    as: 'userProducts',
  });
};

module.exports = ProductMaster;
