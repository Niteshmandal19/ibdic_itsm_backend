const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LevelsRequestType = sequelize.define("Levels_RequestTypes", {
  request_type_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  issue_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'levels_issue_types',
      key: 'issue_type_id',
    },
  },
  request_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'levels_request_types',
  timestamps: false,
});

// Define associations
LevelsRequestType.associate = (models) => {
  LevelsRequestType.belongsTo(models.LevelsIssueType, {
    foreignKey: 'issue_type_id',
    targetKey: 'issue_type_id',
  });
};

module.exports = LevelsRequestType;
