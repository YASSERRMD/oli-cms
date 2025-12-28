/**
 * Validation Middleware
 * Reusable validation rules using express-validator
 */

'use strict';

const { body, param, query, validationResult } = require('express-validator');

// =============================================================================
// VALIDATION ERROR HANDLER
// =============================================================================

/**
 * Handle validation errors
 * Use this after validation rules to check for errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            error: 'Validation Error',
            message: 'The request data failed validation.',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }

    next();
};

// =============================================================================
// COMMON FIELD VALIDATORS
// =============================================================================

/**
 * Page ID validation
 * - Required
 * - Alphanumeric with hyphens and underscores
 * - 1-100 characters
 */
const pageIdParam = param('pageId')
    .trim()
    .notEmpty()
    .withMessage('Page ID is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Page ID must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Page ID can only contain letters, numbers, hyphens, and underscores');

const pageIdBody = body('pageId')
    .trim()
    .notEmpty()
    .withMessage('Page ID is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Page ID must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Page ID can only contain letters, numbers, hyphens, and underscores');

/**
 * Title validation
 * - Required
 * - Max 200 characters
 * - Trimmed
 */
const title = body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters')
    .escape();

/**
 * Optional title validation
 */
const titleOptional = body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters')
    .escape();

/**
 * Slug validation
 * - Required
 * - Lowercase alphanumeric with hyphens
 * - 1-150 characters
 */
const slug = body('slug')
    .trim()
    .notEmpty()
    .withMessage('Slug is required')
    .isLength({ min: 1, max: 150 })
    .withMessage('Slug must be between 1 and 150 characters')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must be lowercase with hyphens between words (e.g., "my-page-slug")');

/**
 * Optional slug validation
 */
const slugOptional = body('slug')
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Slug must be between 1 and 150 characters')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must be lowercase with hyphens between words');

/**
 * Content validation
 * - Required for pages
 * - Max 500KB (approximately)
 */
const content = body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 500000 })
    .withMessage('Content must not exceed 500KB');

/**
 * Optional content validation
 */
const contentOptional = body('content')
    .optional()
    .isLength({ max: 500000 })
    .withMessage('Content must not exceed 500KB');

/**
 * Description validation
 * - Optional
 * - Max 500 characters
 */
const description = body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .escape();

/**
 * Status validation
 * - Must be one of: draft, published, archived
 */
const status = body('status')
    .optional()
    .trim()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be one of: draft, published, archived');

/**
 * Boolean validation
 * @param {string} fieldName - Name of the field to validate
 */
const booleanField = (fieldName) => body(fieldName)
    .optional()
    .isBoolean()
    .withMessage(`${fieldName} must be a boolean value`)
    .toBoolean();

/**
 * Email validation
 */
const email = body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail();

/**
 * Password validation
 * - Min 8 characters
 * - At least one uppercase, lowercase, number
 */
const password = body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');

/**
 * Username validation
 * - 3-30 characters
 * - Alphanumeric with underscores
 */
const username = body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores');

/**
 * Pagination query validation
 */
const pagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
    query('sort')
        .optional()
        .matches(/^-?[a-zA-Z_]+$/)
        .withMessage('Invalid sort field format'),
    query('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Order must be asc or desc')
];

/**
 * Search query validation
 */
const searchQuery = query('q')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query must not exceed 200 characters')
    .escape();

// =============================================================================
// VALIDATION RULE SETS
// =============================================================================

/**
 * Rules for creating a page
 */
const createPageRules = [
    pageIdBody,
    title,
    slug,
    content,
    description,
    status,
    handleValidationErrors
];

/**
 * Rules for updating a page
 */
const updatePageRules = [
    pageIdParam,
    titleOptional,
    slugOptional,
    contentOptional,
    description,
    status,
    handleValidationErrors
];

/**
 * Rules for getting a page
 */
const getPageRules = [
    pageIdParam,
    handleValidationErrors
];

/**
 * Rules for listing pages
 */
const listPagesRules = [
    ...pagination,
    searchQuery,
    handleValidationErrors
];

/**
 * Rules for user registration
 */
const registerRules = [
    username,
    email,
    password,
    handleValidationErrors
];

/**
 * Rules for user login
 */
const loginRules = [
    body('username')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Valid email is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// =============================================================================
// CUSTOM VALIDATORS
// =============================================================================

/**
 * Create a custom validation chain
 * @param {string} field - Field name
 * @param {Object} options - Validation options
 */
const createValidator = (field, options = {}) => {
    let validator = body(field);

    if (options.required) {
        validator = validator.notEmpty().withMessage(`${field} is required`);
    } else {
        validator = validator.optional();
    }

    if (options.trim) {
        validator = validator.trim();
    }

    if (options.minLength) {
        validator = validator.isLength({ min: options.minLength })
            .withMessage(`${field} must be at least ${options.minLength} characters`);
    }

    if (options.maxLength) {
        validator = validator.isLength({ max: options.maxLength })
            .withMessage(`${field} must not exceed ${options.maxLength} characters`);
    }

    if (options.pattern) {
        validator = validator.matches(options.pattern)
            .withMessage(options.patternMessage || `${field} format is invalid`);
    }

    if (options.escape) {
        validator = validator.escape();
    }

    return validator;
};

/**
 * Sanitize and validate file name
 */
const sanitizeFileName = (fileName) => {
    if (!fileName || typeof fileName !== 'string') {
        return null;
    }
    // Remove path traversal attempts and special characters
    return fileName
        .replace(/\.\./g, '')
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
        .trim();
};

module.exports = {
    // Error handler
    handleValidationErrors,

    // Individual validators
    pageIdParam,
    pageIdBody,
    title,
    titleOptional,
    slug,
    slugOptional,
    content,
    contentOptional,
    description,
    status,
    booleanField,
    email,
    password,
    username,
    pagination,
    searchQuery,

    // Validation rule sets
    createPageRules,
    updatePageRules,
    getPageRules,
    listPagesRules,
    registerRules,
    loginRules,

    // Utilities
    createValidator,
    sanitizeFileName,

    // Re-export express-validator utilities
    body,
    param,
    query,
    validationResult
};
