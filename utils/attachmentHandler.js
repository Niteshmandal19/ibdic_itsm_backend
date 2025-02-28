const { Attachment } = require('../models');

const handleAttachments = async (files, {
    attachableId,
    attachableType,
    uploadedBy,
    transaction
}) => {
    if (!files || !files.length) return [];

    const attachments = await Promise.all(
        files.map(file => 
            Attachment.create({
                attachableId,
                attachableType,
                filePath: file.path,
                originalName: file.originalname,
                mimeType: file.mimetype,
                fileSize: file.size,
                uploadedBy
            }, { transaction })
        )
    );

    return attachments;
};

module.exports = { handleAttachments };