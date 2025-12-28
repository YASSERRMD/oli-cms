/**
 * Logger Utility
 * Structured logging with levels
 */

'use strict';

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const LEVEL_COLORS = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    debug: '\x1b[90m'  // Gray
};

const RESET_COLOR = '\x1b[0m';

const LOG_DIR = path.join(process.cwd(), 'logs');

// =============================================================================
// LOGGER CLASS
// =============================================================================

class Logger {
    constructor(options = {}) {
        this.level = options.level || process.env.LOG_LEVEL || 'info';
        this.useColors = options.colors !== false && process.env.NODE_ENV !== 'production';
        this.logToFile = options.logToFile !== false;
        this.context = options.context || 'app';

        // Ensure log directory exists
        if (this.logToFile && !fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
    }

    /**
     * Check if level should be logged
     */
    shouldLog(level) {
        return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
    }

    /**
     * Format log message
     */
    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';

        return {
            timestamp,
            level: level.toUpperCase(),
            context: this.context,
            message,
            meta: metaStr,
            formatted: `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}${metaStr ? ' ' + metaStr : ''}`
        };
    }

    /**
     * Write to console
     */
    writeToConsole(level, formatted) {
        const output = this.useColors
            ? `${LEVEL_COLORS[level]}${formatted}${RESET_COLOR}`
            : formatted;

        if (level === 'error') {
            console.error(output);
        } else if (level === 'warn') {
            console.warn(output);
        } else {
            console.log(output);
        }
    }

    /**
     * Write to file
     */
    writeToFile(level, formatted) {
        if (!this.logToFile) return;

        const logFile = level === 'error'
            ? path.join(LOG_DIR, 'error.log')
            : path.join(LOG_DIR, 'combined.log');

        try {
            fs.appendFileSync(logFile, formatted + '\n');
        } catch (e) {
            // Silently fail file logging
        }
    }

    /**
     * Core log method
     */
    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) return;

        const { formatted } = this.formatMessage(level, message, meta);
        this.writeToConsole(level, formatted);
        this.writeToFile(level, formatted);
    }

    /**
     * Error level
     */
    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    /**
     * Warn level
     */
    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    /**
     * Info level
     */
    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    /**
     * Debug level
     */
    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    /**
     * Create child logger with context
     */
    child(context) {
        return new Logger({
            level: this.level,
            colors: this.useColors,
            logToFile: this.logToFile,
            context: `${this.context}:${context}`
        });
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

const logger = new Logger();

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    Logger,
    logger,
    LOG_LEVELS,

    // Convenience methods
    error: (msg, meta) => logger.error(msg, meta),
    warn: (msg, meta) => logger.warn(msg, meta),
    info: (msg, meta) => logger.info(msg, meta),
    debug: (msg, meta) => logger.debug(msg, meta),
    child: (ctx) => logger.child(ctx)
};
