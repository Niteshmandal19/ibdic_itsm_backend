// const sequelize = require('../config/database')

// const TicketAssigneeLog = sequelize.define('TicketAssigneeLog', {
//     ticket_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false
//     },
//     previousAssigneeId: {
//       type: DataTypes.INTEGER,
//       allowNull: true
//     },
//     newAssigneeId: {
//       type: DataTypes.INTEGER,
//       allowNull: false
//     },
//     changedById: {
//       type: DataTypes.INTEGER,
//       allowNull: false
//     }
//   });


// module.exports = TicketAssigneeLog;


const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class TicketAssigneeLog extends Model {}

TicketAssigneeLog.init({
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  previousAssigneeId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  newAssigneeId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  changedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, { 
    sequelize, 
    modelName: 'TicketAssigneeLog',
    tableName: 'ticketassigneelog' 
});

module.exports = TicketAssigneeLog;
