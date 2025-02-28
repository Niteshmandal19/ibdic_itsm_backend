const { createReadStream } = require('fs');
const csv = require('csv-parser');
const s3Service = require('./s3Services');
const { Transform } = require('stream');

class FileValidationService {
    constructor() {
        this.batchSize = parseInt(process.env.BATCH_SIZE) || 1000;
        this.validationRules = {
            entity_registration: [
                { field: 'channel', type: 'string', required: true, maxLength: 16 },
                { field: 'hubId', type: 'string', required: true, maxLength: 16 },
                { field: 'idpId', type: 'string', required: true, maxLength: 4 },
                { field: 'requestID', type: 'string', required: true, maxLength: 30 },
                { field: 'noOfEntities', type: 'number', required: true, maxLength: 4 },
                { field: 'entityCode', type: 'string', required: true, maxLength: 20 },
                { field: 'noOfIdentifiers', type: 'number', required: true, maxLength: 2 },
                { field: 'entityIdType', type: 'string', required: true, maxLength: 50 },
                { field: 'entityIdNo', type: 'string', required: true, maxLength: 50 },
                { field: 'entityIdName', type: 'string', required: true, maxLength: 50 },
                { field: 'ifsc', type: 'string', required: true, maxLength: 16 }
            ],
            entity_registration_response: [
                { field: 'channel', type: 'string', required: true, maxLength: 16 },
                { field: 'hubId', type: 'string', required: true, maxLength: 16 },
                { field: 'idpId', type: 'string', required: true, maxLength: 4 },
                { field: 'requestID', type: 'string', required: true, maxLength: 30 },
                { field: 'code', type: 'string', required: true, maxLength: 10 }
            ],
            invoice_registration: [
                { field: 'channel', type: 'string', required: true, maxLength: 16 },
                { field: 'hubId', type: 'string', required: true, maxLength: 16 },
                { field: 'idpId', type: 'string', required: true, maxLength: 4 },
                { field: 'requestID', type: 'string', required: true, maxLength: 30 },
                { field: 'groupingId', type: 'string', required: false, maxLength: 30 },
                { field: 'sellerCode', type: 'string', required: true, maxLength: 20 },
                { field: 'buyerCode', type: 'string', required: true, maxLength: 20 },
                { field: 'sellerGst', type: 'string', required: true, maxLength: 20 },
                { field: 'buyerGst', type: 'string', required: true, maxLength: 20 },
                { field: 'noOfInvoices', type: 'string', required: true, maxLength: 4 },
                { field: 'invoiceNo', type: 'string', required: true, maxLength: 100 },
                { field: 'invoiceDate', type: 'string', required: true, maxLength: 10 },
                { field: 'invoiceAmt', type: 'string', required: true, maxLength: 20 },
                { field: 'verifyGSTNFlag', type: 'boolean', required: true },
                { field: 'invoiceDueDate', type: 'string', required: false, maxLength: 10 }
            ],
            invoice_registration_response: [
                { field: 'channel', type: 'string', required: true, maxLength: 16 },
                { field: 'hubId', type: 'string', required: true, maxLength: 16 },
                { field: 'idpId', type: 'string', required: true, maxLength: 4 },
                { field: 'requestID', type: 'string', required: true, maxLength: 30 },
                { field: 'groupingId', type: 'string', required: false, maxLength: 30 },
                { field: 'ledgerNo', type: 'string', required: true, maxLength: 100 },
                { field: 'code', type: 'string', required: true, maxLength: 10 },
                { field: 'message', type: 'string', required: true, maxLength: 250 }
            ],
            invoice_registration_no_entity: [
                { field: 'channel', type: 'string', required: true, maxLength: 16 },
                { field: 'hubId', type: 'string', required: true, maxLength: 16 },
                { field: 'idpId', type: 'string', required: true, maxLength: 4 },
                { field: 'requestID', type: 'string', required: true, maxLength: 30 },
                { field: 'groupingId', type: 'string', required: false, maxLength: 30 },
                { field: 'sellerGst', type: 'string', required: false, maxLength: 20 },
                { field: 'buyerGst', type: 'string', required: false, maxLength: 20 },
                { field: 'noOfInvoices', type: 'string', required: true, maxLength: 4 },
                { field: 'invoiceNo', type: 'string', required: true, maxLength: 100 },
                { field: 'invoiceDate', type: 'string', required: true, maxLength: 10 },
                { field: 'invoiceAmt', type: 'string', required: true, maxLength: 20 },
                { field: 'verifyGSTNFlag', type: 'boolean', required: true },
                { field: 'invoiceDueDate', type: 'string', required: false, maxLength: 10 },
                { field: 'sellerDataNo', type: 'string', required: false, maxLength: 2 },
                { field: 'sellerIdType', type: 'string', required: false, maxLength: 50 },
                { field: 'sellerIdNo', type: 'string', required: false, maxLength: 50 },
                { field: 'sellerIdName', type: 'string', required: false, maxLength: 50 },
                { field: 'sellerIfsc', type: 'string', required: false, maxLength: 16 },
                { field: 'buyerDataNo', type: 'string', required: false, maxLength: 2 },
                { field: 'buyerIdType', type: 'string', required: false, maxLength: 50 },
                { field: 'buyerIdNo', type: 'string', required: false, maxLength: 50 },
                { field: 'buyerIdName', type: 'string', required: false, maxLength: 50 },
                { field: 'buyerIfsc', type: 'string', required: false, maxLength: 16 }
            ],
            invoice_registration_no_entity_response: [
                { field: 'channel', type: 'string', required: true, maxLength: 16 },
                { field: 'hubId', type: 'string', required: true, maxLength: 16 },
                { field: 'idpId', type: 'string', required: true, maxLength: 4 },
                { field: 'requestID', type: 'string', required: true, maxLength: 30 },
                { field: 'groupingId', type: 'string', required: false, maxLength: 30 },
                { field: 'ledgerNo', type: 'string', required: true, maxLength: 100 },
                { field: 'code', type: 'string', required: true, maxLength: 10 },
                { field: 'message', type: 'string', required: true, maxLength: 250 }
            ],
            finance_request: [
                { field: 'channel', type: 'string', required: true, maxLength: 16 },
                { field: 'hubId', type: 'string', required: true, maxLength: 16 },
                { field: 'idpId', type: 'string', required: true, maxLength: 4 },
                { field: 'requestID', type: 'string', required: true, maxLength: 30 },
                { field: 'ledgerNo', type: 'string', required: true, maxLength: 100 },
                { field: 'ledgerAmtFlag', type: 'string', required: false, validValues: ['P', 'F'] },
                { field: 'lenderCategory', type: 'string', required: false, maxLength: 50 },
                { field: 'lenderName', type: 'string', required: false, maxLength: 64 },
                { field: 'lenderCode', type: 'string', required: false, maxLength: 20 },
                { field: 'borrowerCategory', type: 'string', required: false, maxLength: 50 },
                { field: 'noOfInvoices', type: 'string', required: true, maxLength: 4 },
                { field: 'invoiceNo', type: 'string', required: true, maxLength: 100 },
                { field: 'invoiceDate', type: 'string', required: true, maxLength: 10 },
                { field: 'invoiceAmt', type: 'string', required: true, maxLength: 20 },
                { field: 'financeRequestAmt', type: 'string', required: true, maxLength: 20 },
                { field: 'financeRequestDate', type: 'string', required: true, maxLength: 10 },
                { field: 'dueDate', type: 'string', required: true, maxLength: 10 },
                { field: 'fundingAmtFlag', type: 'string', required: false, maxLength: 20, validValues: ['P', 'F'] },
                { field: 'adjustmentType', type: 'string', required: true, maxLength: 30, validValues: ['None', 'Advance', 'Credit Note'] },
                { field: 'adjustmentAmt', type: 'string', required: true, maxLength: 20 }
            ],

            finance_response: [
                { field: 'channel', type: 'string', required: true, maxLength: 16 },
                { field: 'hubId', type: 'string', required: true, maxLength: 16 },
                { field: 'idpId', type: 'string', required: true, maxLength: 4 },
                { field: 'requestID', type: 'string', required: true, maxLength: 30 },
                { field: 'ledgerNo', type: 'string', required: true, maxLength: 100 },
                { field: 'code', type: 'string', required: true, maxLength: 10 },
                { field: 'message', type: 'string', required: true, maxLength: 250 },
                { field: 'invoiceNo', type: 'string', required: true, maxLength: 100 },
                { field: 'invoiceDate', type: 'string', required: true, maxLength: 10 },
                { field: 'invoiceAmt', type: 'string', required: true, maxLength: 20 },
                { field: 'invoiceStatus', type: 'string', required: true, maxLength: 20 },
                { field: 'fundedAmt', type: 'string', required: true, maxLength: 20 },
                { field: 'gstVerificationStatus', type: 'string', required: true, maxLength: 20 }
            ],
            cancellation_request: [
                { field: 'channel', type: 'string', required: true, maxLength: 16 },
                { field: 'hubId', type: 'string', required: true, maxLength: 16 },
                { field: 'idpId', type: 'string', required: true, maxLength: 4 },
                { field: 'requestID', type: 'string', required: true, maxLength: 30 },
                { field: 'ledgerNo', type: 'string', required: true, maxLength: 100 },
                { field: 'cancellationReason', type: 'string', required: true, maxLength: 250 }
            ],

            cancellation_response: [
                { field: 'channel', type: 'string', required: true, maxLength: 16 },
                { field: 'hubId', type: 'string', required: true, maxLength: 16 },
                { field: 'idpId', type: 'string', required: true, maxLength: 4 },
                { field: 'requestID', type: 'string', required: true, maxLength: 30 },
                { field: 'ledgerNo', type: 'string', required: true, maxLength: 100 },
                { field: 'code', type: 'string', required: true, maxLength: 10 }
            ]
        };
    }



    validateRow(row, apiType) {
        const errors = [];
        const rules = this.validationRules[apiType];

        if (!rules) {
            return { errors: [`Invalid API type: ${apiType}`] };
        }

        // Special validation for IFSC when entityIdType is bank account
        if (apiType === 'entity_registration' &&
            row.entityIdType &&
            row.entityIdType.toLowerCase().includes('bank') &&
            (!row.ifsc || row.ifsc.trim() === '')) {
            errors.push('IFSC is required when Entity ID Type is Bank Account');
        }

        // Special validation for invoice registration without entity code
        if (apiType === 'invoice_registration_no_entity') {
            // Validate seller identification
            if (!row.sellerGst) {
                // If sellerGst is not provided, all seller identification fields become mandatory
                const sellerFields = ['sellerDataNo', 'sellerIdType', 'sellerIdNo', 'sellerIdName'];
                sellerFields.forEach(field => {
                    if (!row[field]) {
                        errors.push(`${field} is required when sellerGst is not provided`);
                    }
                });

                // Check IFSC if bank account is provided
                if (row.sellerIdType &&
                    row.sellerIdType.toLowerCase().includes('bank') &&
                    !row.sellerIfsc) {
                    errors.push('sellerIfsc is required when seller ID type is bank account');
                }
            }

            // Validate buyer identification
            if (!row.buyerGst) {
                // If buyerGst is not provided, all buyer identification fields become mandatory
                const buyerFields = ['buyerDataNo', 'buyerIdType', 'buyerIdNo', 'buyerIdName'];
                buyerFields.forEach(field => {
                    if (!row[field]) {
                        errors.push(`${field} is required when buyerGst is not provided`);
                    }
                });

                // Check IFSC if bank account is provided
                if (row.buyerIdType &&
                    row.buyerIdType.toLowerCase().includes('bank') &&
                    !row.buyerIfsc) {
                    errors.push('buyerIfsc is required when buyer ID type is bank account');
                }

            }
        };

        if (apiType === 'finance_request') {
            // Validate adjustment amount based on adjustment type
            if (row.adjustmentType) {
                const adjustmentAmt = parseFloat(row.adjustmentAmt || '0');

                if (row.adjustmentType.toLowerCase() === 'none' && adjustmentAmt !== 0) {
                    errors.push('adjustmentAmt must be 0 when adjustmentType is None');
                } else if (row.adjustmentType.toLowerCase() !== 'none' && adjustmentAmt === 0) {
                    errors.push('adjustmentAmt cannot be 0 when adjustmentType is not None');
                }
            }

            // Validate finance request amount is not greater than invoice amount
            const invoiceAmt = parseFloat(row.invoiceAmt || '0');
            const financeRequestAmt = parseFloat(row.financeRequestAmt || '0');
            if (financeRequestAmt > invoiceAmt) {
                errors.push('financeRequestAmt cannot be greater than invoiceAmt');
            }

            // Validate due date is after finance request date
            if (row.financeRequestDate && row.dueDate) {
                const requestDate = this.parseDate(row.financeRequestDate);
                const dueDate = this.parseDate(row.dueDate);
                if (requestDate && dueDate && dueDate <= requestDate) {
                    errors.push('dueDate must be after financeRequestDate');
                }
            }
        }

        // Special validation for cancellation request
        if (apiType === 'cancellation_request') {
            // Validate cancellation reason is not just whitespace
            if (row.cancellationReason && row.cancellationReason.trim().length === 0) {
                errors.push('cancellationReason cannot be empty or only whitespace');
            }

            // Validate ledgerNo format (if there's a specific format requirement)
            if (row.ledgerNo && !/^[A-Za-z0-9-_]+$/.test(row.ledgerNo)) {
                errors.push('ledgerNo can only contain alphanumeric characters, hyphens, and underscores');
            }
        }

        // Special validation for cancellation response
        if (apiType === 'cancellation_response') {
            // Validate response code format
            if (row.code) {
                const validCode = /^[0-9]{3}$/.test(row.code);
                if (!validCode) {
                    errors.push('code must be a 3-digit number');
                }
            }
        }



        // Standard field validation
        rules.forEach(rule => {
            const value = row[rule.field];

            // Required field validation
            if (rule.required && (value === undefined || value === null || value === '')) {
                errors.push(`${rule.field} is required`);
                return;
            }

            if (value !== undefined && value !== null && value !== '') {
                // Type validation
                if (rule.type === 'string' && typeof value !== 'string') {
                    errors.push(`${rule.field} must be a string`);
                }

                if (rule.type === 'boolean') {
                    if (value !== '0' && value !== '1' && value !== true && value !== false) {
                        errors.push(`${rule.field} must be a boolean (true/false or 1/0)`);
                    }
                }

                // Length validation
                if (rule.maxLength) {
                    const strValue = String(value);
                    if (strValue.length > rule.maxLength) {
                        errors.push(`${rule.field} exceeds maximum length of ${rule.maxLength}`);
                    }
                }

                // Date format validation
                if ((rule.field === 'invoiceDate' || rule.field === 'invoiceDueDate') && value) {
                    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/;
                    if (!dateRegex.test(value)) {
                        errors.push(`${rule.field} must be in DD/MM/YYYY format`);
                    }
                }

                // GST format validation
                if ((rule.field === 'sellerGst' || rule.field === 'buyerGst') && value) {
                    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
                    if (!gstRegex.test(value)) {
                        errors.push(`${rule.field} must be a valid GST number`);
                    }
                }

                // Invoice amount validation
                if (rule.field === 'invoiceAmt' && value) {
                    const amountRegex = /^\d+(\.\d{1,2})?$/;
                    if (!amountRegex.test(value)) {
                        errors.push(`${rule.field} must be a valid number with up to 2 decimal places`);
                    }
                }
                // Valid values validation
                if (rule.validValues && !rule.validValues.includes(value)) {
                    errors.push(`${rule.field} must be one of: ${rule.validValues.join(', ')}`);
                }
                if (rule.field.toLowerCase().includes('amt')) {
                    const amountRegex = /^\d+(\.\d{1,2})?$/;
                    if (!amountRegex.test(value)) {
                        errors.push(`${rule.field} must be a valid number with up to 2 decimal places`);
                    }
                }

                 // Channel validation
                 if (rule.field === 'channel') {
                    const validChannels = ['Hub', 'Direct', 'IBDIC'];
                    if (!validChannels.includes(value)) {
                        errors.push(`channel must be one of: ${validChannels.join(', ')}`);
                    }
                }

                // ID format validations
                if (rule.field === 'idpId') {
                    if (!/^\d{4}$/.test(value)) {
                        errors.push('idpId must be a 4-digit number');
                    }
                }

                if (rule.field === 'hubId') {
                    if (!/^[A-Za-z0-9]{1,16}$/.test(value)) {
                        errors.push('hubId must be alphanumeric and up to 16 characters');
                    }
                }

            }
        });

        return { errors };
    };

    parseDate(dateStr) {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('/');
        return new Date(year, month - 1, day);
    }

    // Rest of the class implementation remains the same
    async validateStream(fileStream, apiType) {
        return new Promise((resolve, reject) => {
            const errors = [];
            let rowCount = 0;
            let batch = [];

            const processingStream = new Transform({
                objectMode: true,
                transform: (row, encoding, callback) => {
                    rowCount++;
                    const validationResult = this.validateRow(row, apiType);

                    if (validationResult.errors.length > 0) {
                        errors.push({
                            rowNumber: rowCount,
                            data: row,
                            errors: validationResult.errors
                        });
                    }

                    batch.push(row);
                    if (batch.length >= this.batchSize) {
                        // Process batch here if needed
                        batch = [];
                    }

                    callback(null, row);
                }
            });

            fileStream
                .pipe(csv())
                .pipe(processingStream)
                .on('finish', () => {
                    resolve({ errors, rowCount });
                })
                .on('error', reject);
        });
    }
}

module.exports = FileValidationService;