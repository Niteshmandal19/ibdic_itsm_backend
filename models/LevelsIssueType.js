const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LevelsIssueType = sequelize.define("Levels_IssueTypes", {
  issue_type_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_code: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: 'product_master',
      key: 'product_code',
    },
  },
  issue_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'levels_issue_types',
  timestamps: false,
});

// Define associations
LevelsIssueType.associate = (models) => {
  LevelsIssueType.belongsTo(models.ProductMaster, {
    foreignKey: 'product_code',
    targetKey: 'product_code',
  });
  LevelsIssueType.hasMany(models.LevelsRequestType, {
    foreignKey: 'issue_type_id',
    sourceKey: 'issue_type_id',
    as: 'requestTypes',
  });
};

module.exports = LevelsIssueType;
