const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Import all models
const User = require('./User');
const Comment = require('./Comment');
const Ticket = require('./Ticket');
const UserProduct = require('./UserProduct');
const ProductMaster = require('./ProductMaster');
const LevelsIssueType = require('./LevelsIssueType');
const LevelsRequestType = require('./LevelsRequestType');
const Attachment = require('./Attachment');
const SftpProcessing = require('./SftpProcessing');
const FileName = require('./FileName');
const FilterChild = require('./FilterChild');
const FilterParent = require('./FilterParent');

// Create models object
const models = {
    User,
    Ticket,
    Comment,
    UserProduct,
    ProductMaster,
    LevelsIssueType,
    LevelsRequestType,
    Attachment,
    SftpProcessing,
    FileName,
    FilterChild,
    FilterParent
};

// Initialize associations
Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

module.exports = {
    ...models,
    sequelize
};