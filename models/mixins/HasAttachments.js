const HasAttachments = {
    hasAttachments(models) {
        // Add the association method
        this.hasMany(models.Attachment, {
            foreignKey: 'attachableId',
            constraints: false,
            scope: {
                attachableType: this.name
            },
            as: 'attachments'
        });
    },

    // Helper method to include attachments in queries
    includeAttachments(models) {
        return {
            model: models.Attachment,
            as: 'attachments',
            where: {
                attachableType: this.name
            },
            required: false
        };
    }
};

module.exports = HasAttachments;