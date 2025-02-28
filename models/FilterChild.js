const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 

  const FilterChild = sequelize.define('FilterChild', {
    filter_child_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    filter_child_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filter_parent_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    value: {
      type: DataTypes.STRING
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },{
    tableName: 'filterchild',
    timestamps: false
});

  FilterChild.associate = (models) => {
    FilterChild.belongsTo(models.FilterParent, {
      foreignKey: 'filter_parent_id',
      as: 'parent'
    });
  };

  module.exports = FilterChild;