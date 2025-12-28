/**
 * File Storage Utility
 * JSON-based page management with atomic writes and security features
 */

'use strict';

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// CONSTANTS
// =============================================================================

/** Directory for page storage */
const PAGES_DIR = path.join(__dirname, '..', 'data', 'pages');

/** Valid page ID pattern */
const PAGE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Maximum page ID length */
const MAX_PAGE_ID_LENGTH = 100;

/** File permissions (owner: rw, group: r, others: none) */
const FILE_PERMISSIONS = 0o640;

/** Required fields for a valid page */
const REQUIRED_PAGE_FIELDS = ['id', 'title'];

// =============================================================================
// DIRECTORY MANAGEMENT
// =============================================================================

/**
 * Ensure the pages directory exists
 * @returns {Promise<void>}
 */
async function ensurePagesDir() {
    try {
        await fsPromises.mkdir(PAGES_DIR, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            const err = new Error(`Failed to create pages directory: ${error.message}`);
            err.code = 'PAGES_DIR_ERROR';
            err.originalError = error;
            throw err;
        }
    }
}

// =============================================================================
// PATH SECURITY
// =============================================================================

/**
 * Get a safe file path for the given page ID
 * Prevents directory traversal attacks
 * @param {string} pageId - The page identifier
 * @returns {string} Safe absolute file path
 * @throws {Error} If pageId is invalid or path is outside pages directory
 */
function getSafeFilePath(pageId) {
    // Validate pageId type
    if (!pageId || typeof pageId !== 'string') {
        const error = new Error('Page ID must be a non-empty string');
        error.code = 'INVALID_PAGE_ID';
        throw error;
    }

    // Trim and validate length
    const trimmedId = pageId.trim();
    if (trimmedId.length === 0 || trimmedId.length > MAX_PAGE_ID_LENGTH) {
        const error = new Error(`Page ID must be between 1 and ${MAX_PAGE_ID_LENGTH} characters`);
        error.code = 'INVALID_PAGE_ID';
        throw error;
    }

    // Validate format (alphanumeric, hyphens, underscores only)
    if (!PAGE_ID_PATTERN.test(trimmedId)) {
        const error = new Error('Page ID can only contain letters, numbers, hyphens, and underscores');
        error.code = 'INVALID_PAGE_ID';
        throw error;
    }

    // Construct the file path
    const fileName = `${trimmedId}.json`;
    const filePath = path.join(PAGES_DIR, fileName);

    // Security: Ensure resolved path is within PAGES_DIR
    const resolvedPath = path.resolve(filePath);
    const resolvedPagesDir = path.resolve(PAGES_DIR);

    if (!resolvedPath.startsWith(resolvedPagesDir + path.sep)) {
        const error = new Error('Invalid page ID: path traversal detected');
        error.code = 'PATH_TRAVERSAL';
        throw error;
    }

    return resolvedPath;
}

// =============================================================================
// PAGE CRUD OPERATIONS
// =============================================================================

/**
 * Read a page from disk
 * @param {string} pageId - The page identifier
 * @returns {Promise<Object>} Parsed page object
 * @throws {Error} If page not found or invalid JSON
 */
async function readPage(pageId) {
    const filePath = getSafeFilePath(pageId);

    try {
        const content = await fsPromises.readFile(filePath, 'utf8');
        const page = JSON.parse(content);

        // Validate required fields
        for (const field of REQUIRED_PAGE_FIELDS) {
            if (!page[field]) {
                const error = new Error(`Invalid page data: missing required field '${field}'`);
                error.code = 'INVALID_PAGE_DATA';
                throw error;
            }
        }

        return page;
    } catch (error) {
        if (error.code === 'ENOENT') {
            const err = new Error(`Page not found: ${pageId}`);
            err.code = 'PAGE_NOT_FOUND';
            err.pageId = pageId;
            throw err;
        }

        if (error.name === 'SyntaxError') {
            const err = new Error(`Invalid JSON in page file: ${pageId}`);
            err.code = 'INVALID_JSON';
            err.pageId = pageId;
            throw err;
        }

        // Re-throw if it's our validation error
        if (error.code === 'INVALID_PAGE_DATA' || error.code === 'INVALID_PAGE_ID') {
            throw error;
        }

        const err = new Error(`Failed to read page: ${error.message}`);
        err.code = 'READ_ERROR';
        err.originalError = error;
        throw err;
    }
}

/**
 * Write a page to disk with atomic write pattern
 * @param {string} pageId - The page identifier
 * @param {Object} pageData - The page data to write
 * @returns {Promise<Object>} The saved page data
 * @throws {Error} If validation fails or write error
 */
async function writePage(pageId, pageData) {
    // Validate pageData
    if (!pageData || typeof pageData !== 'object') {
        const error = new Error('Page data must be an object');
        error.code = 'INVALID_PAGE_DATA';
        throw error;
    }

    // Validate required fields
    for (const field of REQUIRED_PAGE_FIELDS) {
        if (!pageData[field]) {
            const error = new Error(`Page data missing required field: ${field}`);
            error.code = 'INVALID_PAGE_DATA';
            throw error;
        }
    }

    // Verify pageData.id matches pageId
    if (pageData.id !== pageId) {
        const error = new Error(`Page ID mismatch: expected '${pageId}', got '${pageData.id}'`);
        error.code = 'PAGE_ID_MISMATCH';
        throw error;
    }

    const filePath = getSafeFilePath(pageId);

    // Check if page exists (for created timestamp)
    let isNew = true;
    let existingPage = null;
    try {
        existingPage = await readPage(pageId);
        isNew = false;
    } catch (error) {
        if (error.code !== 'PAGE_NOT_FOUND') {
            throw error;
        }
    }

    // Ensure pages directory exists
    await ensurePagesDir();

    // Prepare metadata
    const now = new Date().toISOString();
    const metadata = {
        ...pageData.metadata,
        updated: now
    };

    // Preserve created timestamp or set new one
    if (!isNew && existingPage?.metadata?.created) {
        metadata.created = existingPage.metadata.created;
    } else if (!metadata.created) {
        metadata.created = now;
    }

    // Build final page object
    const finalPageData = {
        ...pageData,
        metadata
    };

    // Generate temp file path
    const tempPath = `${filePath}.${crypto.randomBytes(8).toString('hex')}.tmp`;

    try {
        // Write to temp file
        const jsonContent = JSON.stringify(finalPageData, null, 2);
        await fsPromises.writeFile(tempPath, jsonContent, {
            encoding: 'utf8',
            mode: FILE_PERMISSIONS
        });

        // Atomic rename
        await fsPromises.rename(tempPath, filePath);

        // Set permissions (in case rename didn't preserve them)
        await fsPromises.chmod(filePath, FILE_PERMISSIONS);

        return finalPageData;
    } catch (error) {
        // Cleanup temp file on error
        try {
            await fsPromises.unlink(tempPath);
        } catch (cleanupError) {
            // Ignore cleanup errors
        }

        const err = new Error(`Failed to write page: ${error.message}`);
        err.code = 'WRITE_ERROR';
        err.originalError = error;
        throw err;
    }
}

/**
 * Delete a page from disk
 * @param {string} pageId - The page identifier
 * @param {boolean} secureDelete - If true, overwrite with random data before deleting
 * @returns {Promise<Object>} Success object with pageId
 * @throws {Error} If page not found or delete error
 */
async function deletePage(pageId, secureDelete = false) {
    const filePath = getSafeFilePath(pageId);

    try {
        // Check if file exists
        await fsPromises.access(filePath);

        // Secure delete: overwrite with random data
        if (secureDelete) {
            const stats = await fsPromises.stat(filePath);
            const randomData = crypto.randomBytes(stats.size);
            await fsPromises.writeFile(filePath, randomData);
            // Sync to ensure data is written to disk
            const fd = await fsPromises.open(filePath, 'r+');
            await fd.sync();
            await fd.close();
        }

        // Delete the file
        await fsPromises.unlink(filePath);

        return { success: true, pageId };
    } catch (error) {
        if (error.code === 'ENOENT') {
            const err = new Error(`Page not found: ${pageId}`);
            err.code = 'PAGE_NOT_FOUND';
            err.pageId = pageId;
            throw err;
        }

        const err = new Error(`Failed to delete page: ${error.message}`);
        err.code = 'DELETE_ERROR';
        err.originalError = error;
        throw err;
    }
}

// =============================================================================
// PAGE LISTING AND SEARCH
// =============================================================================

/**
 * List all pages with summary information
 * @returns {Promise<Array>} Array of page summaries sorted by updated (newest first)
 */
async function listPages() {
    try {
        await ensurePagesDir();

        const files = await fsPromises.readdir(PAGES_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        const pages = [];

        for (const file of jsonFiles) {
            const pageId = path.basename(file, '.json');

            try {
                const page = await readPage(pageId);

                pages.push({
                    id: page.id,
                    title: page.title,
                    slug: page.slug || null,
                    status: page.status || 'draft',
                    created: page.metadata?.created || null,
                    updated: page.metadata?.updated || null,
                    generator: page.generator || null
                });
            } catch (error) {
                // Skip invalid files but log the error
                console.warn(`Warning: Could not read page file ${file}: ${error.message}`);
            }
        }

        // Sort by updated timestamp (newest first)
        pages.sort((a, b) => {
            const dateA = a.updated ? new Date(a.updated) : new Date(0);
            const dateB = b.updated ? new Date(b.updated) : new Date(0);
            return dateB - dateA;
        });

        return pages;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }

        const err = new Error(`Failed to list pages: ${error.message}`);
        err.code = 'LIST_ERROR';
        err.originalError = error;
        throw err;
    }
}

/**
 * Search pages by title, slug, or id
 * @param {string} query - Search query (case-insensitive)
 * @returns {Promise<Array>} Matching page summaries
 */
async function searchPages(query) {
    if (!query || typeof query !== 'string') {
        return listPages();
    }

    const normalizedQuery = query.toLowerCase().trim();

    if (normalizedQuery.length === 0) {
        return listPages();
    }

    const allPages = await listPages();

    return allPages.filter(page => {
        const idMatch = page.id?.toLowerCase().includes(normalizedQuery);
        const titleMatch = page.title?.toLowerCase().includes(normalizedQuery);
        const slugMatch = page.slug?.toLowerCase().includes(normalizedQuery);

        return idMatch || titleMatch || slugMatch;
    });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a page exists
 * @param {string} pageId - The page identifier
 * @returns {Promise<boolean>} True if page exists
 */
async function pageExists(pageId) {
    try {
        const filePath = getSafeFilePath(pageId);
        await fsPromises.access(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get file statistics for a page
 * @param {string} pageId - The page identifier
 * @returns {Promise<Object>} File statistics object
 */
async function getPageStats(pageId) {
    const filePath = getSafeFilePath(pageId);

    try {
        const stats = await fsPromises.stat(filePath);

        return {
            pageId,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            accessed: stats.atime.toISOString(),
            isFile: stats.isFile(),
            permissions: (stats.mode & 0o777).toString(8)
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            const err = new Error(`Page not found: ${pageId}`);
            err.code = 'PAGE_NOT_FOUND';
            err.pageId = pageId;
            throw err;
        }

        const err = new Error(`Failed to get page stats: ${error.message}`);
        err.code = 'STATS_ERROR';
        err.originalError = error;
        throw err;
    }
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =============================================================================
// IMPORT/EXPORT FUNCTIONS
// =============================================================================

/**
 * Export a page as a JSON string
 * @param {string} pageId - The page identifier
 * @returns {Promise<string>} Pretty-printed JSON string
 */
async function exportPage(pageId) {
    const page = await readPage(pageId);
    return JSON.stringify(page, null, 2);
}

/**
 * Import a page from JSON data
 * @param {string|Object} jsonData - JSON string or object
 * @param {boolean} overwrite - If true, overwrite existing page
 * @returns {Promise<Object>} The saved page
 */
async function importPage(jsonData, overwrite = false) {
    let pageData;

    // Parse JSON if string
    if (typeof jsonData === 'string') {
        try {
            pageData = JSON.parse(jsonData);
        } catch (error) {
            const err = new Error('Invalid JSON data provided');
            err.code = 'INVALID_JSON';
            throw err;
        }
    } else if (typeof jsonData === 'object' && jsonData !== null) {
        pageData = jsonData;
    } else {
        const error = new Error('Import data must be a JSON string or object');
        error.code = 'INVALID_IMPORT_DATA';
        throw error;
    }

    // Validate required fields
    for (const field of REQUIRED_PAGE_FIELDS) {
        if (!pageData[field]) {
            const error = new Error(`Import data missing required field: ${field}`);
            error.code = 'INVALID_PAGE_DATA';
            throw error;
        }
    }

    const pageId = pageData.id;

    // Check if page exists
    const exists = await pageExists(pageId);
    if (exists && !overwrite) {
        const error = new Error(`Page already exists: ${pageId}. Set overwrite=true to replace.`);
        error.code = 'PAGE_EXISTS';
        error.pageId = pageId;
        throw error;
    }

    // Save the page
    return writePage(pageId, pageData);
}

// =============================================================================
// BACKUP FUNCTIONS
// =============================================================================

/**
 * Create a backup of all pages
 * @returns {Promise<string>} JSON string containing all pages
 */
async function backupAllPages() {
    const allPages = [];

    try {
        await ensurePagesDir();

        const files = await fsPromises.readdir(PAGES_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        for (const file of jsonFiles) {
            const pageId = path.basename(file, '.json');

            try {
                const page = await readPage(pageId);
                allPages.push(page);
            } catch (error) {
                console.warn(`Warning: Could not backup page ${pageId}: ${error.message}`);
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        pageCount: allPages.length,
        pages: allPages
    };

    return JSON.stringify(backup, null, 2);
}

/**
 * Restore pages from a backup
 * @param {string} backupJson - Backup JSON string
 * @param {boolean} overwrite - If true, overwrite existing pages
 * @returns {Promise<Object>} Restore summary
 */
async function restoreFromBackup(backupJson, overwrite = false) {
    let backup;

    try {
        backup = JSON.parse(backupJson);
    } catch (error) {
        const err = new Error('Invalid backup JSON data');
        err.code = 'INVALID_BACKUP';
        throw err;
    }

    if (!backup.version || !backup.pages || !Array.isArray(backup.pages)) {
        const error = new Error('Invalid backup format: missing version or pages array');
        error.code = 'INVALID_BACKUP_FORMAT';
        throw error;
    }

    const results = {
        total: backup.pages.length,
        restored: 0,
        skipped: 0,
        errors: []
    };

    for (const page of backup.pages) {
        try {
            await importPage(page, overwrite);
            results.restored++;
        } catch (error) {
            if (error.code === 'PAGE_EXISTS') {
                results.skipped++;
            } else {
                results.errors.push({
                    pageId: page.id,
                    error: error.message
                });
            }
        }
    }

    return results;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    // Constants
    PAGES_DIR,
    PAGE_ID_PATTERN,
    REQUIRED_PAGE_FIELDS,

    // Directory management
    ensurePagesDir,

    // Path security
    getSafeFilePath,

    // CRUD operations
    readPage,
    writePage,
    deletePage,

    // Listing and search
    listPages,
    searchPages,

    // Utilities
    pageExists,
    getPageStats,
    formatBytes,

    // Import/export
    exportPage,
    importPage,

    // Backup
    backupAllPages,
    restoreFromBackup
};
