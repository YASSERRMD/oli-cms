/**
 * Pages API Routes
 * CRUD operations for page management
 */

'use strict';

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const fileStorage = require('../utils/fileStorage');

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
    param('id')
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
 * Create page validation
 */
const validateCreatePage = [
    body('id')
        .trim()
        .notEmpty()
        .withMessage('Page ID is required')
        .isLength({ max: 100 })
        .withMessage('Page ID must not exceed 100 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Page ID can only contain letters, numbers, hyphens, and underscores'),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('slug')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('Slug must not exceed 150 characters')
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Slug must be lowercase with hyphens'),
    body('generator')
        .optional()
        .isIn(['blog-post', 'landing-page', 'product', 'contact', 'about', 'custom', null])
        .withMessage('Invalid generator type'),
    body('content')
        .optional()
        .isObject()
        .withMessage('Content must be an object'),
    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    handleValidationErrors
];

/**
 * Update page validation
 */
const validateUpdatePage = [
    param('id')
        .trim()
        .notEmpty()
        .withMessage('Page ID is required')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid Page ID format'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('slug')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('Slug must not exceed 150 characters'),
    body('content')
        .optional()
        .isObject()
        .withMessage('Content must be an object'),
    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    body('status')
        .optional()
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Status must be draft, published, or archived'),
    handleValidationErrors
];

/**
 * Add section validation
 */
const validateAddSection = [
    param('id')
        .trim()
        .notEmpty()
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid Page ID format'),
    body('type')
        .trim()
        .notEmpty()
        .withMessage('Section type is required')
        .isIn(['hero', 'text', 'gallery', 'form', 'rich-text', 'custom', 'cta', 'features', 'testimonials', 'pricing', 'faq'])
        .withMessage('Invalid section type'),
    body('data')
        .optional()
        .isObject()
        .withMessage('Section data must be an object'),
    handleValidationErrors
];

/**
 * Import page validation
 */
const validateImportPage = [
    body('jsonData')
        .notEmpty()
        .withMessage('JSON data is required'),
    body('overwrite')
        .optional()
        .isBoolean()
        .withMessage('Overwrite must be a boolean'),
    handleValidationErrors
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate slug from title
 */
function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Generate unique section ID
 */
function generateSectionId() {
    return `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /pages
 * List all pages with optional search
 */
router.get('/', [
    query('search')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Search query too long'),
    handleValidationErrors
], async (req, res, next) => {
    try {
        const { search } = req.query;

        let pages;
        if (search) {
            pages = await fileStorage.searchPages(search);
        } else {
            pages = await fileStorage.listPages();
        }

        res.json({
            success: true,
            count: pages.length,
            pages
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /pages/:id
 * Get single page with full content
 */
router.get('/:id', validatePageId, async (req, res, next) => {
    try {
        const { id } = req.params;
        const page = await fileStorage.readPage(id);

        res.json({
            success: true,
            page
        });
    } catch (error) {
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({
                error: 'Not Found',
                message: `Page '${req.params.id}' not found`
            });
        }
        next(error);
    }
});

/**
 * POST /pages
 * Create new page
 */
router.post('/', validateCreatePage, async (req, res, next) => {
    try {
        const { id, title, slug, generator, content, metadata } = req.body;

        // Check if page already exists
        const exists = await fileStorage.pageExists(id);
        if (exists) {
            return res.status(409).json({
                error: 'Conflict',
                message: `Page '${id}' already exists`
            });
        }

        // Build page object
        const pageData = {
            id,
            title,
            slug: slug || generateSlug(title),
            generator: generator || null,
            status: 'draft',
            content: content || {
                sections: []
            },
            metadata: {
                ...metadata,
                author: req.session?.user?.username || 'anonymous',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            },
            attachments: []
        };

        const savedPage = await fileStorage.writePage(id, pageData);

        res.status(201).json({
            success: true,
            message: 'Page created successfully',
            page: savedPage
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /pages/:id
 * Update existing page
 */
router.put('/:id', validateUpdatePage, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, slug, content, metadata, status } = req.body;

        // Get existing page
        let page;
        try {
            page = await fileStorage.readPage(id);
        } catch (error) {
            if (error.code === 'PAGE_NOT_FOUND') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Page '${id}' not found`
                });
            }
            throw error;
        }

        // Update allowed fields
        if (title !== undefined) page.title = title;
        if (slug !== undefined) page.slug = slug;
        if (content !== undefined) page.content = content;
        if (status !== undefined) page.status = status;

        // Merge metadata
        if (metadata !== undefined) {
            page.metadata = {
                ...page.metadata,
                ...metadata
            };
        }

        // Update timestamp
        page.metadata.updated = new Date().toISOString();
        page.metadata.updatedBy = req.session?.user?.username || 'anonymous';

        const savedPage = await fileStorage.writePage(id, page);

        res.json({
            success: true,
            message: 'Page updated successfully',
            page: savedPage
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /pages/:id
 * Delete page
 */
router.delete('/:id', [
    ...validatePageId.slice(0, -1),
    query('secure')
        .optional()
        .isBoolean()
        .withMessage('Secure must be a boolean')
        .toBoolean(),
    handleValidationErrors
], async (req, res, next) => {
    try {
        const { id } = req.params;
        const { secure } = req.query;

        const result = await fileStorage.deletePage(id, secure === true);

        res.json({
            success: true,
            message: 'Page deleted successfully',
            pageId: result.pageId
        });
    } catch (error) {
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({
                error: 'Not Found',
                message: `Page '${req.params.id}' not found`
            });
        }
        next(error);
    }
});

/**
 * POST /pages/:id/sections
 * Add section to page
 */
router.post('/:id/sections', validateAddSection, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type, data } = req.body;

        // Get existing page
        let page;
        try {
            page = await fileStorage.readPage(id);
        } catch (error) {
            if (error.code === 'PAGE_NOT_FOUND') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Page '${id}' not found`
                });
            }
            throw error;
        }

        // Ensure content.sections exists
        if (!page.content) page.content = {};
        if (!page.content.sections) page.content.sections = [];

        // Create new section
        const section = {
            id: generateSectionId(),
            type,
            data: data || {},
            order: page.content.sections.length,
            createdAt: new Date().toISOString()
        };

        // Append section
        page.content.sections.push(section);

        // Update timestamp
        page.metadata.updated = new Date().toISOString();

        const savedPage = await fileStorage.writePage(id, page);

        res.status(201).json({
            success: true,
            message: 'Section added successfully',
            section,
            page: savedPage
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /pages/:id/sections/:sectionId
 * Remove section from page
 */
router.delete('/:id/sections/:sectionId', [
    param('id')
        .trim()
        .notEmpty()
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid Page ID format'),
    param('sectionId')
        .trim()
        .notEmpty()
        .withMessage('Section ID is required'),
    handleValidationErrors
], async (req, res, next) => {
    try {
        const { id, sectionId } = req.params;

        // Get existing page
        let page;
        try {
            page = await fileStorage.readPage(id);
        } catch (error) {
            if (error.code === 'PAGE_NOT_FOUND') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Page '${id}' not found`
                });
            }
            throw error;
        }

        // Check if sections exist
        if (!page.content?.sections || page.content.sections.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'No sections found in this page'
            });
        }

        // Find and remove section
        const originalLength = page.content.sections.length;
        page.content.sections = page.content.sections.filter(s => s.id !== sectionId);

        if (page.content.sections.length === originalLength) {
            return res.status(404).json({
                error: 'Not Found',
                message: `Section '${sectionId}' not found`
            });
        }

        // Reorder remaining sections
        page.content.sections.forEach((section, index) => {
            section.order = index;
        });

        // Update timestamp
        page.metadata.updated = new Date().toISOString();

        const savedPage = await fileStorage.writePage(id, page);

        res.json({
            success: true,
            message: 'Section removed successfully',
            page: savedPage
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /pages/:id/export
 * Export page as JSON file download
 */
router.get('/:id/export', validatePageId, async (req, res, next) => {
    try {
        const { id } = req.params;
        const jsonString = await fileStorage.exportPage(id);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${id}.json"`);
        res.send(jsonString);
    } catch (error) {
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({
                error: 'Not Found',
                message: `Page '${req.params.id}' not found`
            });
        }
        next(error);
    }
});

/**
 * POST /pages/import
 * Import page from JSON
 */
router.post('/import', validateImportPage, async (req, res, next) => {
    try {
        const { jsonData, overwrite } = req.body;

        const page = await fileStorage.importPage(jsonData, overwrite === true);

        res.status(201).json({
            success: true,
            message: 'Page imported successfully',
            page
        });
    } catch (error) {
        if (error.code === 'PAGE_EXISTS') {
            return res.status(409).json({
                error: 'Conflict',
                message: error.message
            });
        }
        if (error.code === 'INVALID_JSON' || error.code === 'INVALID_PAGE_DATA') {
            return res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
        next(error);
    }
});

/**
 * GET /pages/backup/all
 * Export all pages as backup
 */
router.get('/backup/all', async (req, res, next) => {
    try {
        const backupJson = await fileStorage.backupAllPages();

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="pages-backup-${Date.now()}.json"`);
        res.send(backupJson);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /pages/restore
 * Restore pages from backup
 */
router.post('/restore', [
    body('backupData')
        .notEmpty()
        .withMessage('Backup data is required'),
    body('overwrite')
        .optional()
        .isBoolean()
        .withMessage('Overwrite must be a boolean'),
    handleValidationErrors
], async (req, res, next) => {
    try {
        const { backupData, overwrite } = req.body;

        const backupJson = typeof backupData === 'string'
            ? backupData
            : JSON.stringify(backupData);

        const results = await fileStorage.restoreFromBackup(backupJson, overwrite === true);

        res.json({
            success: true,
            message: 'Restore completed',
            results
        });
    } catch (error) {
        if (error.code === 'INVALID_BACKUP' || error.code === 'INVALID_BACKUP_FORMAT') {
            return res.status(400).json({
                error: 'Bad Request',
                message: error.message
            });
        }
        next(error);
    }
});

module.exports = router;
