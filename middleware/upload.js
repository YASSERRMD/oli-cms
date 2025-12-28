/**
 * Secure File Upload Middleware
 * Multer configuration with whitelist validation and security features
 */

'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Allowed MIME types organized by category
 */
const ALLOWED_MIMES = {
    document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/rtf'
    ],
    image: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/tiff'
    ],
    audio: [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/webm',
        'audio/ogg',
        'audio/aac',
        'audio/flac'
    ],
    video: [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/ogg',
        'video/mpeg'
    ],
    archive: [
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/vnd.rar',
        'application/x-7z-compressed',
        'application/gzip',
        'application/x-tar'
    ]
};

/**
 * Flattened array of all allowed MIME types
 */
const ALL_ALLOWED_MIMES = Object.values(ALLOWED_MIMES).flat();

/**
 * Allowed extensions mapped to categories
 */
const ALLOWED_EXTENSIONS = {
    // Documents
    '.pdf': 'document',
    '.doc': 'document',
    '.docx': 'document',
    '.xls': 'document',
    '.xlsx': 'document',
    '.ppt': 'document',
    '.pptx': 'document',
    '.txt': 'document',
    '.csv': 'document',
    '.rtf': 'document',

    // Images
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.gif': 'image',
    '.webp': 'image',
    '.svg': 'image',
    '.bmp': 'image',
    '.tiff': 'image',
    '.tif': 'image',

    // Audio
    '.mp3': 'audio',
    '.wav': 'audio',
    '.webm': 'audio', // Can be audio or video
    '.ogg': 'audio',
    '.aac': 'audio',
    '.flac': 'audio',

    // Video
    '.mp4': 'video',
    '.mov': 'video',
    '.avi': 'video',
    '.wmv': 'video',
    '.mpeg': 'video',
    '.mpg': 'video',

    // Archives
    '.zip': 'archive',
    '.rar': 'archive',
    '.7z': 'archive',
    '.gz': 'archive',
    '.tar': 'archive'
};

/**
 * Upload directory path (outside web root)
 */
const uploadDir = path.join(process.cwd(), 'data', 'uploads');

/**
 * Maximum file size (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Maximum files per request
 */
const MAX_FILES = 5;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Ensure upload directory exists
 */
function ensureUploadDir() {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
}

/**
 * Get file category from MIME type
 * @param {string} mimetype - The MIME type
 * @returns {string} Category name or 'unknown'
 */
function getFileCategory(mimetype) {
    if (!mimetype || typeof mimetype !== 'string') {
        return 'unknown';
    }

    const normalizedMime = mimetype.toLowerCase().trim();

    for (const [category, mimes] of Object.entries(ALLOWED_MIMES)) {
        if (mimes.includes(normalizedMime)) {
            return category;
        }
    }

    return 'unknown';
}

/**
 * Validate filename for security
 * @param {string} filename - Original filename
 * @returns {boolean} True if filename is safe
 */
function isValidFilename(filename) {
    if (!filename || typeof filename !== 'string') {
        return false;
    }

    // Check for directory traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return false;
    }

    // Check for null bytes
    if (filename.includes('\0')) {
        return false;
    }

    // Check for problematic characters
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) {
        return false;
    }

    return true;
}

/**
 * Generate secure random filename
 * @param {string} originalName - Original filename for extension
 * @returns {string} Secure random filename
 */
function generateSecureFilename(originalName) {
    const ext = path.extname(originalName).toLowerCase();
    const randomName = crypto.randomBytes(16).toString('hex');
    return `${randomName}${ext}`;
}

/**
 * Calculate SHA256 checksum of a string
 * @param {string} data - Data to hash
 * @returns {string} SHA256 hash
 */
function calculateChecksum(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// =============================================================================
// MULTER CONFIGURATION
// =============================================================================

/**
 * Disk storage configuration
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            ensureUploadDir();
            cb(null, uploadDir);
        } catch (error) {
            cb(new Error('Failed to create upload directory'));
        }
    },

    filename: (req, file, cb) => {
        try {
            const secureFilename = generateSecureFilename(file.originalname);
            cb(null, secureFilename);
        } catch (error) {
            cb(new Error('Failed to generate secure filename'));
        }
    }
});

/**
 * File filter for validation
 */
const fileFilter = (req, file, cb) => {
    try {
        // Validate original filename
        if (!isValidFilename(file.originalname)) {
            const error = new Error('Invalid filename: contains prohibited characters');
            error.code = 'INVALID_FILENAME';
            return cb(error, false);
        }

        // Get and validate extension
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ext || !ALLOWED_EXTENSIONS[ext]) {
            const error = new Error(`File extension '${ext || 'none'}' is not allowed`);
            error.code = 'INVALID_EXTENSION';
            return cb(error, false);
        }

        // Validate MIME type
        const mimetype = file.mimetype.toLowerCase();
        if (!ALL_ALLOWED_MIMES.includes(mimetype)) {
            const error = new Error(`MIME type '${mimetype}' is not allowed`);
            error.code = 'INVALID_MIME_TYPE';
            return cb(error, false);
        }

        // Validate MIME type matches extension category
        const extCategory = ALLOWED_EXTENSIONS[ext];
        const mimeCategory = getFileCategory(mimetype);

        // Allow webm in both audio and video categories
        if (ext !== '.webm' && extCategory !== mimeCategory && mimeCategory !== 'unknown') {
            const error = new Error('File extension does not match MIME type');
            error.code = 'MIME_EXTENSION_MISMATCH';
            return cb(error, false);
        }

        // Accept the file
        cb(null, true);
    } catch (error) {
        cb(new Error('File validation failed'));
    }
};

/**
 * Multer configuration
 */
const multerConfig = {
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES,
        fields: 10,
        fieldSize: 1024 * 1024 // 1MB for text fields
    }
};

/**
 * Multer instance
 */
const upload = multer(multerConfig);

// =============================================================================
// UPLOAD MIDDLEWARE
// =============================================================================

/**
 * Single file upload middleware
 * Field name: 'file'
 */
const uploadSingle = upload.single('file');

/**
 * Multiple files upload middleware
 * Field name: 'files', max 5 files
 */
const uploadMultiple = upload.array('files', MAX_FILES);

/**
 * Middleware to validate uploaded file exists
 */
const validateUploadedFile = (req, res, next) => {
    // Check if file was uploaded
    if (!req.file) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'No file was uploaded'
        });
    }

    // Validate file properties
    if (!req.file.filename || !req.file.path) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid file upload: missing filename or path'
        });
    }

    // Verify file exists on disk
    if (!fs.existsSync(req.file.path)) {
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'File upload failed: file not found on disk'
        });
    }

    next();
};

/**
 * Middleware to validate multiple uploaded files
 */
const validateUploadedFiles = (req, res, next) => {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'No files were uploaded'
        });
    }

    // Validate each file
    for (const file of req.files) {
        if (!file.filename || !file.path) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid file upload: missing filename or path'
            });
        }

        if (!fs.existsSync(file.path)) {
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'File upload failed: file not found on disk'
            });
        }
    }

    next();
};

// =============================================================================
// METADATA FUNCTIONS
// =============================================================================

/**
 * Generate metadata for an uploaded file
 * @param {Object} file - Multer file object
 * @returns {Object} File metadata
 */
function generateFileMetadata(file) {
    if (!file || typeof file !== 'object') {
        throw new Error('Invalid file object');
    }

    const category = getFileCategory(file.mimetype);
    const checksum = calculateChecksum(file.filename + file.originalname + Date.now());

    return {
        id: crypto.randomUUID(),
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        sizeFormatted: formatBytes(file.size),
        category,
        extension: path.extname(file.originalname).toLowerCase(),
        uploadedAt: new Date().toISOString(),
        checksum,
        path: file.path,
        destination: file.destination
    };
}

/**
 * Sanitize file metadata for client response
 * Removes sensitive information like full paths
 * @param {Object} metadata - Full metadata object
 * @returns {Object} Sanitized metadata
 */
function sanitizeFileMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
        return null;
    }

    return {
        id: metadata.id,
        filename: metadata.filename,
        originalName: metadata.originalName,
        mimetype: metadata.mimetype,
        size: metadata.size,
        sizeFormatted: metadata.sizeFormatted,
        category: metadata.category,
        extension: metadata.extension,
        uploadedAt: metadata.uploadedAt,
        checksum: metadata.checksum
        // Deliberately exclude: path, destination
    };
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
// ERROR HANDLING
// =============================================================================

/**
 * Multer error handler middleware
 * Converts Multer errors to user-friendly responses
 */
const handleUploadError = (error, req, res, next) => {
    // Handle Multer errors
    if (error instanceof multer.MulterError) {
        const errorMessages = {
            LIMIT_FILE_SIZE: `File size exceeds the limit of ${formatBytes(MAX_FILE_SIZE)}`,
            LIMIT_FILE_COUNT: `Maximum of ${MAX_FILES} files allowed`,
            LIMIT_FIELD_KEY: 'Field name too long',
            LIMIT_FIELD_VALUE: 'Field value too long',
            LIMIT_FIELD_COUNT: 'Too many fields',
            LIMIT_UNEXPECTED_FILE: 'Unexpected file field'
        };

        return res.status(400).json({
            error: 'Upload Error',
            code: error.code,
            message: errorMessages[error.code] || error.message
        });
    }

    // Handle custom validation errors
    if (error.code === 'INVALID_FILENAME' ||
        error.code === 'INVALID_EXTENSION' ||
        error.code === 'INVALID_MIME_TYPE' ||
        error.code === 'MIME_EXTENSION_MISMATCH') {
        return res.status(400).json({
            error: 'Validation Error',
            code: error.code,
            message: error.message
        });
    }

    // Pass other errors to global handler
    next(error);
};

/**
 * Cleanup uploaded file on error
 * @param {string} filePath - Path to file to delete
 */
async function cleanupFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (error) {
        console.warn(`Failed to cleanup file: ${filePath}`, error.message);
    }
}

/**
 * Cleanup multiple uploaded files on error
 * @param {Array} files - Array of file objects
 */
async function cleanupFiles(files) {
    if (!files || !Array.isArray(files)) return;

    for (const file of files) {
        await cleanupFile(file.path);
    }
}

// =============================================================================
// FILE OPERATIONS
// =============================================================================

/**
 * Get file info by filename
 * @param {string} filename - The stored filename
 * @returns {Object|null} File info or null
 */
async function getFileInfo(filename) {
    const filePath = path.join(uploadDir, filename);

    try {
        // Security: Validate filename
        if (!isValidFilename(filename)) {
            return null;
        }

        // Security: Ensure path is within upload directory
        const resolvedPath = path.resolve(filePath);
        const resolvedUploadDir = path.resolve(uploadDir);
        if (!resolvedPath.startsWith(resolvedUploadDir + path.sep)) {
            return null;
        }

        const stats = await fs.promises.stat(filePath);

        return {
            filename,
            path: filePath,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            exists: true
        };
    } catch (error) {
        return null;
    }
}

/**
 * Delete a file by filename
 * @param {string} filename - The stored filename
 * @returns {boolean} True if deleted
 */
async function deleteFile(filename) {
    const filePath = path.join(uploadDir, filename);

    try {
        // Security: Validate filename
        if (!isValidFilename(filename)) {
            return false;
        }

        // Security: Ensure path is within upload directory
        const resolvedPath = path.resolve(filePath);
        const resolvedUploadDir = path.resolve(uploadDir);
        if (!resolvedPath.startsWith(resolvedUploadDir + path.sep)) {
            return false;
        }

        await fs.promises.unlink(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * List all uploaded files
 * @returns {Array} Array of file info objects
 */
async function listUploadedFiles() {
    try {
        ensureUploadDir();
        const files = await fs.promises.readdir(uploadDir);
        const fileInfos = [];

        for (const filename of files) {
            const info = await getFileInfo(filename);
            if (info) {
                fileInfos.push(info);
            }
        }

        return fileInfos;
    } catch (error) {
        return [];
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    // Configuration
    ALLOWED_MIMES,
    ALL_ALLOWED_MIMES,
    ALLOWED_EXTENSIONS,
    uploadDir,
    MAX_FILE_SIZE,
    MAX_FILES,

    // Upload middleware
    uploadSingle,
    uploadMultiple,
    validateUploadedFile,
    validateUploadedFiles,
    handleUploadError,

    // Metadata functions
    generateFileMetadata,
    sanitizeFileMetadata,
    getFileCategory,
    formatBytes,

    // Helper functions
    isValidFilename,
    generateSecureFilename,
    calculateChecksum,
    ensureUploadDir,

    // File operations
    getFileInfo,
    deleteFile,
    listUploadedFiles,
    cleanupFile,
    cleanupFiles
};
