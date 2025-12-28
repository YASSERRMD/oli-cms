/**
 * Validators Utility
 * Reusable validation functions
 */

'use strict';

// =============================================================================
// PATTERNS
// =============================================================================

const PATTERNS = {
    PAGE_ID: /^[a-zA-Z0-9_-]+$/,
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/.+/,
    FILENAME: /^[a-f0-9]{32}\.[a-zA-Z0-9]+$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/
};

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Validate page ID
 */
function pageIdValidator(pageId) {
    if (!pageId || typeof pageId !== 'string') {
        return { valid: false, error: 'Page ID is required' };
    }
    const trimmed = pageId.trim();
    if (trimmed.length === 0 || trimmed.length > 100) {
        return { valid: false, error: 'Page ID must be 1-100 characters' };
    }
    if (!PATTERNS.PAGE_ID.test(trimmed)) {
        return { valid: false, error: 'Page ID can only contain letters, numbers, hyphens, underscores' };
    }
    return { valid: true, value: trimmed };
}

/**
 * Validate title
 */
function titleValidator(title, maxLength = 200) {
    if (!title || typeof title !== 'string') {
        return { valid: false, error: 'Title is required' };
    }
    const trimmed = title.trim();
    if (trimmed.length === 0) {
        return { valid: false, error: 'Title cannot be empty' };
    }
    if (trimmed.length > maxLength) {
        return { valid: false, error: `Title must not exceed ${maxLength} characters` };
    }
    return { valid: true, value: trimmed };
}

/**
 * Validate slug
 */
function slugValidator(slug) {
    if (!slug) return { valid: true, value: null };
    if (typeof slug !== 'string') {
        return { valid: false, error: 'Slug must be a string' };
    }
    const trimmed = slug.trim().toLowerCase();
    if (trimmed.length > 150) {
        return { valid: false, error: 'Slug must not exceed 150 characters' };
    }
    if (!PATTERNS.SLUG.test(trimmed)) {
        return { valid: false, error: 'Slug must be lowercase with hyphens only' };
    }
    return { valid: true, value: trimmed };
}

/**
 * Validate email
 */
function emailValidator(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }
    const trimmed = email.trim().toLowerCase();
    if (!PATTERNS.EMAIL.test(trimmed)) {
        return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true, value: trimmed };
}

/**
 * Validate URL
 */
function urlValidator(url) {
    if (!url || typeof url !== 'string') {
        return { valid: false, error: 'URL is required' };
    }
    try {
        new URL(url);
        return { valid: true, value: url };
    } catch {
        return { valid: false, error: 'Invalid URL format' };
    }
}

/**
 * Validate file type
 */
function fileTypeValidator(mimetype, allowedTypes) {
    if (!mimetype) {
        return { valid: false, error: 'MIME type is required' };
    }
    if (!allowedTypes || !Array.isArray(allowedTypes)) {
        return { valid: true, value: mimetype };
    }
    if (!allowedTypes.includes(mimetype.toLowerCase())) {
        return { valid: false, error: `File type '${mimetype}' is not allowed` };
    }
    return { valid: true, value: mimetype };
}

/**
 * Validate filename format
 */
function filenameValidator(filename) {
    if (!filename || typeof filename !== 'string') {
        return { valid: false, error: 'Filename is required' };
    }
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return { valid: false, error: 'Invalid filename: path traversal detected' };
    }
    return { valid: true, value: filename };
}

/**
 * Validate required field
 */
function requiredValidator(value, fieldName = 'Field') {
    if (value === undefined || value === null || value === '') {
        return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, value };
}

/**
 * Validate number in range
 */
function numberValidator(value, { min, max, fieldName = 'Value' } = {}) {
    if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, error: `${fieldName} must be a number` };
    }
    if (min !== undefined && value < min) {
        return { valid: false, error: `${fieldName} must be at least ${min}` };
    }
    if (max !== undefined && value > max) {
        return { valid: false, error: `${fieldName} must not exceed ${max}` };
    }
    return { valid: true, value };
}

/**
 * Validate array
 */
function arrayValidator(value, { maxItems, fieldName = 'Array' } = {}) {
    if (!Array.isArray(value)) {
        return { valid: false, error: `${fieldName} must be an array` };
    }
    if (maxItems && value.length > maxItems) {
        return { valid: false, error: `${fieldName} must not exceed ${maxItems} items` };
    }
    return { valid: true, value };
}

/**
 * Sanitize HTML (basic XSS prevention)
 */
function sanitizeHtml(input) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Generate slug from text
 */
function generateSlug(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

module.exports = {
    PATTERNS,
    pageIdValidator,
    titleValidator,
    slugValidator,
    emailValidator,
    urlValidator,
    fileTypeValidator,
    filenameValidator,
    requiredValidator,
    numberValidator,
    arrayValidator,
    sanitizeHtml,
    generateSlug
};
