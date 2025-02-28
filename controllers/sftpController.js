const { SftpProcessing, User, FileName } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { handleAttachments } = require('../utils/attachmentHandler');
const Attachment = require('../models/Attachment')



const getSftpFiles = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const whereConditions = {};
    if (status) whereConditions.status = status;
    if (startDate && endDate) {
      whereConditions.uploaded_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const files = await SftpProcessing.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['first_name']
        }
      ],
      order: [['uploaded_at', 'DESC']]
    });

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching SFTP files', error: error.message });
  }
};

const getFileNames = async (req, res) => {
  try {
    const fileNames = await FileName.findAll({
      attributes: ['file_name_API', 'file_name']
    });

    res.status(200).json({
      success: true,
      data: fileNames
    });
  } catch (error) {
    console.error('Error fetching file names:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching file names'
    });
  }
};

const uploadFile = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const { attachableType, attachableId, fileName, created_by } = req.body;

    // Validate required fields
    if (!attachableType || !fileName) {
      return res.status(400).json({ success: false, message: 'attachableType and fileName are required' });
    }

    // Default to authenticated user ID if created_by is not provided
    const uploadedBy = created_by || req.user?.id;

    // Handle file attachments and save to database
    const attachments = await handleAttachments(req.files, {
      attachableId: attachableId || null, // Allow null for optional IDs
      attachableType,
      uploadedBy,
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      attachments
    });

  } catch (error) {
    await transaction.rollback();
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
};




module.exports = {
  getSftpFiles,
  getFileNames,
  uploadFile
};
