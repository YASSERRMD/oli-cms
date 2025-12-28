/**
 * Secure CMS - Main Express Server
 * Production-ready Express application with comprehensive security middleware
 */

'use strict';

// Load environment variables first
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();

// Environment configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// =============================================================================
// DIRECTORY INITIALIZATION
// =============================================================================

/**
 * Initialize required directories on startup
 */
const initializeDirectories = () => {
  const directories = [
    path.join(__dirname, 'data', 'pages'),
    path.join(__dirname, 'data', 'uploads'),
    path.join(__dirname, 'data', 'generators'),
    path.join(__dirname, 'logs'),
    path.join(__dirname, 'public')
  ];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// Initialize directories
initializeDirectories();

// =============================================================================
// TRUST PROXY (for production behind reverse proxy)
// =============================================================================

if (isProduction) {
  app.set('trust proxy', 1);
}

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// 1. Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null
    }
  },
  crossOriginEmbedderPolicy: !isProduction,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false
}));

// 2. CORS - Cross-Origin Resource Sharing
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// 3. Morgan - Request logging
const morganFormat = isProduction ? 'combined' : 'dev';
const logStream = isProduction
  ? fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' })
  : process.stdout;

app.use(morgan(morganFormat, { stream: logStream }));

// 4. Body parsers
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// 5. Cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET || 'dev-cookie-secret'));

// 6. Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: 'See Retry-After header'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});
app.use(limiter);

// 7. Session management
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  name: 'sessionId',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Use secure cookies in production
if (isProduction) {
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

// 8. CSRF protection
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict'
  }
});

// Apply CSRF to all routes except health check
app.use((req, res, next) => {
  // Skip CSRF for health check and static files
  if (req.path === '/health' || req.path.startsWith('/public/')) {
    return next();
  }
  csrfProtection(req, res, next);
});

// 9. Static files
app.use('/public', express.static(path.join(__dirname, 'public'), {
  maxAge: isProduction ? '1d' : 0,
  etag: true,
  lastModified: true
}));

// =============================================================================
// API ENDPOINTS
// =============================================================================

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

/**
 * CSRF token endpoint
 * GET /api/csrf-token
 */
app.get('/api/csrf-token', (req, res) => {
  res.json({
    csrfToken: req.csrfToken()
  });
});

/**
 * API info endpoint
 * GET /api
 */
app.get('/api', (req, res) => {
  res.json({
    name: 'Secure CMS API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      csrfToken: 'GET /api/csrf-token',
      pages: 'Coming soon...',
      uploads: 'Coming soon...'
    }
  });
});

// =============================================================================
// ROUTE MOUNTING (placeholder for future routes)
// =============================================================================

// Routes will be mounted here
// app.use('/api/pages', require('./routes/pages'));
// app.use('/api/uploads', require('./routes/uploads'));
// app.use('/api/generators', require('./routes/generators'));

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * 404 Not Found handler
 */
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource '${req.originalUrl}' was not found on this server.`,
    path: req.originalUrl,
    method: req.method
  });
});

/**
 * CSRF Error handler
 */
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or missing CSRF token. Please refresh the page and try again.'
    });
  }
  next(err);
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  // Log error details (always log in development, only log errors in production)
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    error: err.message,
    stack: err.stack
  };

  if (!isProduction) {
    console.error('❌ Error:', errorLog);
  } else {
    // In production, log to file
    const logPath = path.join(__dirname, 'logs', 'error.log');
    fs.appendFileSync(logPath, JSON.stringify(errorLog) + '\n');
  }

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Send response
  const response = {
    error: getErrorTitle(statusCode),
    message: isProduction ? getSafeErrorMessage(statusCode) : err.message
  };

  // Include stack trace in development
  if (!isProduction) {
    response.stack = err.stack;
    response.details = err.details || null;
  }

  res.status(statusCode).json(response);
});

/**
 * Get error title based on status code
 */
function getErrorTitle(statusCode) {
  const titles = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    413: 'Payload Too Large',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  return titles[statusCode] || 'Error';
}

/**
 * Get safe error message for production
 */
function getSafeErrorMessage(statusCode) {
  const messages = {
    400: 'The request could not be processed due to invalid data.',
    401: 'Authentication is required to access this resource.',
    403: 'You do not have permission to access this resource.',
    404: 'The requested resource was not found.',
    405: 'The HTTP method is not allowed for this resource.',
    409: 'The request conflicts with the current state of the resource.',
    413: 'The request payload is too large.',
    422: 'The request data could not be processed.',
    429: 'Too many requests. Please try again later.',
    500: 'An unexpected error occurred. Please try again later.',
    502: 'The server received an invalid response from an upstream server.',
    503: 'The service is temporarily unavailable. Please try again later.'
  };
  return messages[statusCode] || 'An error occurred while processing your request.';
}

// =============================================================================
// SERVER STARTUP
// =============================================================================

const server = app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    🔒 SECURE CMS SERVER                        ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  🚀 Server running on port ${PORT}`);
  console.log(`  🌍 Environment: ${NODE_ENV}`);
  console.log(`  📁 Static files: /public`);
  console.log(`  🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`  🔗 API info: http://localhost:${PORT}/api`);
  console.log('═══════════════════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
