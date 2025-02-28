const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 


  const FilterParent = sequelize.define('FilterParent', {
    filter_parent_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    filter_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },{
    tableName: 'filterparent',
    timestamps: false
    
});

  FilterParent.associate = (models) => {
    FilterParent.hasMany(models.FilterChild, {
        foreignKey: 'filter_parent_id',
        as: 'children'
      });  
  };

  
    
module.exports = FilterParent;
