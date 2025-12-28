/**
 * Upload API Routes
 * File upload management endpoints
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const path = require('path');
const fileStorage = require('../utils/fileStorage');
const upload = require('../middleware/upload');

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            error: 'Validation Error',
            message: 'The request data failed validation.',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Page ID validation
 */
const validatePageId = [
    param('pageId')
        .trim()
        .notEmpty()
        .withMessage('Page ID is required')
        .isLength({ max: 100 })
        .withMessage('Page ID must not exceed 100 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Page ID can only contain letters, numbers, hyphens, and underscores'),
    handleValidationErrors
];

/**
 * Filename validation
 */
const validateFilename = [
    param('filename')
        .trim()
        .notEmpty()
        .withMessage('Filename is required')
        .matches(/^[a-f0-9]{32}\.[a-zA-Z0-9]+$/)
        .withMessage('Invalid filename format'),
    handleValidationErrors
];

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /upload
 * Upload single file
 */
router.post('/', [
    upload.uploadSingle,
    upload.handleUploadError,
    upload.validateUploadedFile,
    body('pageId')
        .trim()
        .notEmpty()
        .withMessage('Page ID is required')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid Page ID format'),
    handleValidationErrors
], async (req, res, next) => {
    try {
        const { pageId } = req.body;
        const file = req.file;

        // Check if page exists
        let page;
        try {
            page = await fileStorage.readPage(pageId);
        } catch (error) {
            // Cleanup uploaded file
            await upload.cleanupFile(file.path);

            if (error.code === 'PAGE_NOT_FOUND') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Page '${pageId}' not found. Create the page first.`
                });
            }
            throw error;
        }

        // Generate metadata
        const metadata = upload.generateFileMetadata(file);

        // Ensure attachments array exists
        if (!page.attachments) page.attachments = [];

        // Add attachment to page
        page.attachments.push(upload.sanitizeFileMetadata(metadata));

        // Update page
        page.metadata.updated = new Date().toISOString();
        await fileStorage.writePage(pageId, page);

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            file: upload.sanitizeFileMetadata(metadata)
        });
    } catch (error) {
        // Cleanup on error
        if (req.file) {
            await upload.cleanupFile(req.file.path);
        }
        next(error);
    }
});

/**
 * POST /upload/multiple
 * Upload multiple files (max 5)
 */
router.post('/multiple', [
    upload.uploadMultiple,
    upload.handleUploadError,
    upload.validateUploadedFiles,
    body('pageId')
        .trim()
        .notEmpty()
        .withMessage('Page ID is required')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid Page ID format'),
    handleValidationErrors
], async (req, res, next) => {
    try {
        const { pageId } = req.body;
        const files = req.files;

        // Check if page exists
        let page;
        try {
            page = await fileStorage.readPage(pageId);
        } catch (error) {
            // Cleanup uploaded files
            await upload.cleanupFiles(files);

            if (error.code === 'PAGE_NOT_FOUND') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Page '${pageId}' not found. Create the page first.`
                });
            }
            throw error;
        }

        // Ensure attachments array exists
        if (!page.attachments) page.attachments = [];

        // Process each file
        const uploadedFiles = [];
        for (const file of files) {
            const metadata = upload.generateFileMetadata(file);
            const sanitized = upload.sanitizeFileMetadata(metadata);
            page.attachments.push(sanitized);
            uploadedFiles.push(sanitized);
        }

        // Update page
        page.metadata.updated = new Date().toISOString();
        await fileStorage.writePage(pageId, page);

        res.status(201).json({
            success: true,
            message: `${files.length} file(s) uploaded successfully`,
            count: uploadedFiles.length,
            files: uploadedFiles
        });
    } catch (error) {
        // Cleanup on error
        if (req.files) {
            await upload.cleanupFiles(req.files);
        }
        next(error);
    }
});

/**
 * GET /upload/:pageId
 * List files for page
 */
router.get('/:pageId', validatePageId, async (req, res, next) => {
    try {
        const { pageId } = req.params;

        // Get page
        let page;
        try {
            page = await fileStorage.readPage(pageId);
        } catch (error) {
            if (error.code === 'PAGE_NOT_FOUND') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Page '${pageId}' not found`
                });
            }
            throw error;
        }

        const attachments = page.attachments || [];

        // Verify each file still exists and update metadata
        const verifiedFiles = [];
        for (const attachment of attachments) {
            const fileInfo = await upload.getFileInfo(attachment.filename);
            if (fileInfo) {
                verifiedFiles.push({
                    ...attachment,
                    exists: true,
                    currentSize: fileInfo.size,
                    currentSizeFormatted: fileInfo.sizeFormatted
                });
            } else {
                verifiedFiles.push({
                    ...attachment,
                    exists: false
                });
            }
        }

        res.json({
            success: true,
            pageId,
            count: verifiedFiles.length,
            files: verifiedFiles
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /upload/:pageId/:filename
 * Remove file from page
 */
router.delete('/:pageId/:filename', [
    param('pageId')
        .trim()
        .notEmpty()
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid Page ID format'),
    param('filename')
        .trim()
        .notEmpty()
        .withMessage('Filename is required'),
    handleValidationErrors
], async (req, res, next) => {
    try {
        const { pageId, filename } = req.params;

        // Validate filename format for security
        if (!upload.isValidFilename(filename)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid filename format'
            });
        }

        // Get page
        let page;
        try {
            page = await fileStorage.readPage(pageId);
        } catch (error) {
            if (error.code === 'PAGE_NOT_FOUND') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Page '${pageId}' not found`
                });
            }
            throw error;
        }

        // Find attachment
        if (!page.attachments || page.attachments.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'No attachments found for this page'
            });
        }

        const attachmentIndex = page.attachments.findIndex(a => a.filename === filename);
        if (attachmentIndex === -1) {
            return res.status(404).json({
                error: 'Not Found',
                message: `File '${filename}' not found in page attachments`
            });
        }

        // Delete physical file
        const deleted = await upload.deleteFile(filename);

        // Remove from page attachments
        page.attachments.splice(attachmentIndex, 1);
        page.metadata.updated = new Date().toISOString();
        await fileStorage.writePage(pageId, page);

        res.json({
            success: true,
            message: 'File deleted successfully',
            filename,
            fileDeleted: deleted
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /upload/stats/:pageId
 * Get upload statistics for page
 */
router.get('/stats/:pageId', validatePageId, async (req, res, next) => {
    try {
        const { pageId } = req.params;

        // Get page
        let page;
        try {
            page = await fileStorage.readPage(pageId);
        } catch (error) {
            if (error.code === 'PAGE_NOT_FOUND') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Page '${pageId}' not found`
                });
            }
            throw error;
        }

        const attachments = page.attachments || [];

        // Calculate statistics
        const stats = {
            totalFiles: attachments.length,
            totalSize: 0,
            byCategory: {},
            byExtension: {}
        };

        for (const attachment of attachments) {
            // Size
            stats.totalSize += attachment.size || 0;

            // By category
            const category = attachment.category || 'unknown';
            if (!stats.byCategory[category]) {
                stats.byCategory[category] = { count: 0, size: 0 };
            }
            stats.byCategory[category].count++;
            stats.byCategory[category].size += attachment.size || 0;

            // By extension
            const ext = attachment.extension || 'unknown';
            if (!stats.byExtension[ext]) {
                stats.byExtension[ext] = { count: 0, size: 0 };
            }
            stats.byExtension[ext].count++;
            stats.byExtension[ext].size += attachment.size || 0;
        }

        // Format sizes
        stats.totalSizeFormatted = upload.formatBytes(stats.totalSize);
        for (const category of Object.keys(stats.byCategory)) {
            stats.byCategory[category].sizeFormatted = upload.formatBytes(stats.byCategory[category].size);
        }
        for (const ext of Object.keys(stats.byExtension)) {
            stats.byExtension[ext].sizeFormatted = upload.formatBytes(stats.byExtension[ext].size);
        }

        res.json({
            success: true,
            pageId,
            stats
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /upload/list/all
 * List all uploaded files (admin)
 */
router.get('/list/all', async (req, res, next) => {
    try {
        const files = await upload.listUploadedFiles();

        res.json({
            success: true,
            count: files.length,
            files
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
