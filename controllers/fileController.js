// const { uploadFile, moveFile } = require('../services/s3Service');
// const FileValidationService = require('../services/FileValidationService');
// const fs = require('fs');
// const csvParser = require('csv-parser');
// const AWS = require('aws-sdk');

// const s3 = new AWS.S3();
// const fileValidationService = new FileValidationService({ bucketName: process.env.S3_BUCKET_NAME });

// const processCSV = async (req, res) => {
//   try {
//     const fileKey = `input/${req.body.fileName}`;
//     const fileStream = s3.getObject({ Bucket: process.env.S3_BUCKET_NAME, Key: fileKey }).createReadStream();

//     let errors = [];
//     let validRows = [];
//     const fieldSpecs = fileValidationService.FIELD_SPECS['entity_registration'];

//     fileStream.pipe(csvParser())
//       .on('data', (row) => {
//         const rowErrors = fileValidationService.validateRow(row, fieldSpecs);
//         if (rowErrors.length > 0) {
//           errors.push({ row, errors: rowErrors });
//         } else {
//           validRows.push(row);
//         }
//       })
//       .on('end', async () => {
//         if (errors.length > 0) {
//           const errorFileName = `failed/errors_${req.body.fileName}`;
//           await uploadFile(errorFileName, JSON.stringify(errors, null, 2), 'failed');
//           await moveFile(fileKey, `failed/${req.body.fileName}`);
//           return res.json({ status: 'failed', message: 'Validation errors found', errors: errors.length });
//         }
//         await moveFile(fileKey, `output/${req.body.fileName}`);
//         res.json({ status: 'success', message: '✅ File validated successfully', errors: 0 });
//       });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// module.exports = { processCSV };



const FileValidationService = require('../services/fileValidationService');
const s3Service = require('../services/s3Services');
const logger = require('../utils/logger');
const { Readable } = require('stream');

class FileController {
    constructor() {
        this.validationService = new FileValidationService();
    }

    /**
     * Process and validate a file from S3
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async processFile(req, res) {
        const startTime = Date.now();
        try {
            // Input validation
            const { fileName, apiType } = req.body;
            
            if (!fileName || !apiType) {
                logger.warn('Missing required parameters in request');
                return res.status(400).json({ 
                    error: 'Missing required parameters',
                    requiredFields: ['fileName', 'apiType']
                });
            }

            // Check if file exists
            const fileExists = await s3Service.fileExists(`input/${fileName}`);
            if (!fileExists) {
                logger.error(`File not found: input/${fileName}`);
                return res.status(404).json({
                    error: 'File not found',
                    details: `File input/${fileName} does not exist in S3`
                });
            }

            // Get file stream from S3
            logger.info(`Starting to process file: ${fileName}`);
            const fileStream = await s3Service.getFileStream(`input/${fileName}`);
            
            // Validate file contents
            const validationResult = await this.validationService.validateStream(fileStream, apiType);
            logger.info(`Validation completed for ${fileName}. Found ${validationResult.errors.length} errors`);

            if (validationResult.errors.length > 0) {
                return await this.handleValidationErrors(fileName, validationResult, res);
            }

            // Process successful validation
            await s3Service.moveFile(
                `input/${fileName}`,
                `output/${fileName}`
            );

            const processingTime = Date.now() - startTime;
            logger.info(`File ${fileName} processed successfully in ${processingTime}ms`);

            return res.json({
                status: 'success',
                message: 'File processed successfully',
                details: {
                    fileName,
                    rowCount: validationResult.rowCount,
                    processingTimeMs: processingTime,
                    destination: `output/${fileName}`
                }
            });

        } catch (error) {
            return this.handleProcessingError(error, res);
        }
    }

    /**
     * Handle validation errors by storing error log and moving file
     * @private
     */
    async handleValidationErrors(fileName, validationResult, res) {
        try {
            // Generate unique error file name
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const errorFileName = `errors/${fileName}-${timestamp}.json`;

            // Store error log
            const errorLog = {
                fileName,
                timestamp: new Date().toISOString(),
                totalRows: validationResult.rowCount,
                errorCount: validationResult.errors.length,
                errors: validationResult.errors
            };

            await s3Service.uploadFile(
                errorFileName, 
                JSON.stringify(errorLog, null, 2),
                { ContentType: 'application/json' }
            );

            // Move original file to failed folder
            await s3Service.moveFile(
                `input/${fileName}`,
                `failed/${fileName}`
            );

            logger.info(`Validation errors stored in ${errorFileName}`);
            return res.json({
                status: 'failed',
                message: 'Validation errors found',
                details: {
                    errorFile: errorFileName,
                    errorCount: validationResult.errors.length,
                    totalRows: validationResult.rowCount,
                    failedFilePath: `failed/${fileName}`
                }
            });
        } catch (error) {
            logger.error('Error handling validation errors:', error);
            throw error; // Let the main error handler deal with it
        }
    }

    /**
     * Get error log file from S3
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async getErrorLog(req, res) {
        try {
            const { errorFileName } = req.params;

            // Validate input
            if (!errorFileName) {
                return res.status(400).json({
                    error: 'Missing error file name parameter'
                });
            }

            // Check if error log exists
            const errorLogExists = await s3Service.fileExists(`errors/${errorFileName}`);
            if (!errorLogExists) {
                return res.status(404).json({
                    error: 'Error log not found',
                    details: `Error log errors/${errorFileName} does not exist`
                });
            }

            // Get and parse error log
            const errorLog = await s3Service.getFile(`errors/${errorFileName}`);
            const parsedLog = JSON.parse(errorLog.Body.toString());

            return res.json({
                status: 'success',
                data: parsedLog
            });

        } catch (error) {
            return this.handleProcessingError(error, res);
        }
    }

    /**
     * Central error handler for the controller
     * @private
     */
    handleProcessingError(error, res) {
        logger.error('Error in file processing:', error);
        
        // Determine if it's a known error type
        if (error.code === 'NoSuchKey') {
            return res.status(404).json({
                error: 'File not found',
                details: error.message
            });
        }

        if (error.code === 'AccessDenied') {
            return res.status(403).json({
                error: 'Access denied',
                details: 'Insufficient permissions to access the requested resource'
            });
        }

        // Generic error response
        return res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred while processing the file',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }

    /**
     * Upload a file directly to S3
     * @param {Request} req - Express request object
     * @param {Response} res - Express response object
     */
    async uploadFile(req, res) {
        try {
            const { file } = req;
            if (!file) {
                return res.status(400).json({
                    error: 'No file provided'
                });
            }

            const fileName = `input/${Date.now()}-${file.originalname}`;
            await s3Service.uploadFile(fileName, file.buffer, {
                ContentType: file.mimetype
            });

            return res.json({
                status: 'success',
                message: 'File uploaded successfully',
                fileName
            });

        } catch (error) {
            return this.handleProcessingError(error, res);
        }
    }
}

module.exports = FileController;