const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    CopyObjectCommand,
    ListObjectsV2Command,
    HeadObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Readable } = require('stream');
const logger = require('../utils/logger');

class S3Service {
    constructor() {
        this.client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
        });
        this.bucketName = process.env.S3_BUCKET_NAME;
    }

    /**
     * Upload a file to S3
     * @param {string} key - The S3 key (path + filename)
     * @param {Buffer|Readable|string} content - The file content
     * @param {Object} options - Additional options like ContentType
     * @returns {Promise<Object>} - S3 upload result
     */
    async uploadFile(key, content, options = {}) {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: content,
                ...options
            });

            const result = await this.client.send(command);
            logger.info(`File uploaded successfully to ${key}`);
            return result;
        } catch (error) {
            logger.error(`Error uploading file to ${key}:`, error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    /**
     * Move/Copy a file within S3
     * @param {string} sourceKey - Source file path
     * @param {string} destinationKey - Destination file path
     * @param {boolean} deleteSource - Whether to delete the source file
     * @returns {Promise<Object>} - S3 copy result
     */
    async moveFile(sourceKey, destinationKey, deleteSource = true) {
        try {
            // Copy the file
            const copyCommand = new CopyObjectCommand({
                Bucket: this.bucketName,
                CopySource: `${this.bucketName}/${sourceKey}`,
                Key: destinationKey
            });

            await this.client.send(copyCommand);
            logger.info(`File copied from ${sourceKey} to ${destinationKey}`);

            // Delete the original file if requested
            if (deleteSource) {
                await this.deleteFile(sourceKey);
                logger.info(`Source file ${sourceKey} deleted`);
            }

            return { sourceKey, destinationKey };
        } catch (error) {
            logger.error(`Error moving/copying file from ${sourceKey} to ${destinationKey}:`, error);
            throw new Error(`Failed to move/copy file: ${error.message}`);
        }
    }

    /**
     * Delete a file from S3
     * @param {string} key - The S3 key to delete
     * @returns {Promise<Object>} - S3 delete result
     */
    async deleteFile(key) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            const result = await this.client.send(command);
            logger.info(`File ${key} deleted successfully`);
            return result;
        } catch (error) {
            logger.error(`Error deleting file ${key}:`, error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Get a readable stream of a file from S3
     * @param {string} key - The S3 key to stream
     * @returns {Promise<Readable>} - Readable stream of the file
     */
    async getFileStream(key) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            const response = await this.client.send(command);
            return response.Body;
        } catch (error) {
            logger.error(`Error creating read stream for ${key}:`, error);
            throw new Error(`Failed to create file stream: ${error.message}`);
        }
    }

    /**
     * Get a file from S3
     * @param {string} key - The S3 key to get
     * @returns {Promise<Object>} - S3 get result
     */
    async getFile(key) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            const response = await this.client.send(command);
            // Convert the readable stream to a buffer
            const chunks = [];
            for await (const chunk of response.Body) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            
            logger.info(`File ${key} retrieved successfully`);
            return {
                Body: buffer,
                ContentType: response.ContentType,
                LastModified: response.LastModified,
                ContentLength: response.ContentLength,
                ETag: response.ETag
            };
        } catch (error) {
            logger.error(`Error getting file ${key}:`, error);
            throw new Error(`Failed to get file: ${error.message}`);
        }
    }

    /**
     * List files in a directory
     * @param {string} prefix - The directory prefix to list
     * @param {Object} options - Additional options like MaxKeys
     * @returns {Promise<Object>} - List of files
     */
    async listFiles(prefix, options = {}) {
        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                ...options
            });

            const result = await this.client.send(command);
            logger.info(`Listed ${result.Contents?.length || 0} files in ${prefix}`);
            return result;
        } catch (error) {
            logger.error(`Error listing files in ${prefix}:`, error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    /**
     * Check if a file exists in S3
     * @param {string} key - The S3 key to check
     * @returns {Promise<boolean>} - Whether the file exists
     */
    async fileExists(key) {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            await this.client.send(command);
            return true;
        } catch (error) {
            if (error.name === 'NotFound') {
                return false;
            }
            logger.error(`Error checking file existence ${key}:`, error);
            throw new Error(`Failed to check file existence: ${error.message}`);
        }
    }

    /**
     * Get a signed URL for a file
     * @param {string} key - The S3 key to get URL for
     * @param {number} expirySeconds - URL expiry time in seconds
     * @returns {Promise<string>} - Signed URL
     */
    async getSignedUrl(key, expirySeconds = 3600) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            const url = await getSignedUrl(this.client, command, {
                expiresIn: expirySeconds
            });
            
            logger.info(`Generated signed URL for ${key}`);
            return url;
        } catch (error) {
            logger.error(`Error generating signed URL for ${key}:`, error);
            throw new Error(`Failed to generate signed URL: ${error.message}`);
        }
    }
}

module.exports = new S3Service();