const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path based on your project structure

const OrgMaster = sequelize.define(
  'OrgMaster',
  {
    organization_id: {
      type: DataTypes.STRING(15),
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    member_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address1: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pin_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pan_no: {
      type: DataTypes.STRING,
      allowNull: true,
      // validate: {
      //   is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, // PAN format validation
      // },
    },
    gstn_no: {
      type: DataTypes.STRING,
      allowNull: true,
      // validate: {
      //   is: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/, // GSTN format validation
      // },
    },
    no_of_signatories: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    agreement_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date_of_agreement: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    no_of_users: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    no_of_admins: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    no_of_products: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    org_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.STRING, // Explicitly set as STRING
      allowNull: true, // Ensure column name matches database
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    // Fields for attachment
    attachmentPath: {
      type: DataTypes.STRING, // Path where the file is stored
      allowNull: true,
    },
    attachmentOriginalName: {
      type: DataTypes.STRING, // Original file name
      allowNull: true,
    },
    attachmentMimeType: {
      type: DataTypes.STRING, // MIME type of the file
      allowNull: true,
    },
  },
  {
    tableName: 'org_master', // Explicitly set table name
    timestamps: true, // Enable timestamps
    createdAt: 'created_at', // Map createdAt to created_at
    updatedAt: false, // Disable updatedAt
  }
);

module.exports = OrgMaster;
