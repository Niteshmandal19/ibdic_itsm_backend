const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class TicketStatusLog extends Model {}

TicketStatusLog.init({
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  previousStatus: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  newStatus: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  changedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, { sequelize, modelName: 'TicketStatusLog' });

module.exports = TicketStatusLog;
