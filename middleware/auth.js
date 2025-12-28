/**
 * Authentication Middleware
 * Placeholder for protecting routes - can be expanded for JWT/session auth
 */

'use strict';

/**
 * Check if user is authenticated via session
 * Attaches user data to req.user if authenticated
 */
const isAuthenticated = (req, res, next) => {
    // Check for session-based authentication
    if (req.session && req.session.user) {
        req.user = req.session.user;
        return next();
    }

    // Authentication failed
    return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please log in to access this resource.'
    });
};

/**
 * Check if user has admin role
 * Must be used after isAuthenticated middleware
 */
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required.'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required for this resource.'
        });
    }

    return next();
};

/**
 * Check if user has specific role(s)
 * @param {string|string[]} roles - Required role(s)
 */
const hasRole = (roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
            });
        }

        return next();
    };
};

/**
 * Optional authentication - attaches user if logged in, continues otherwise
 * Useful for routes that behave differently for authenticated users
 */
const optionalAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
    } else {
        req.user = null;
    }
    return next();
};

/**
 * Login user - creates session
 * @param {Object} req - Express request object
 * @param {Object} userData - User data to store in session
 */
const loginUser = (req, userData) => {
    req.session.user = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role || 'user',
        loginAt: new Date().toISOString()
    };
};

/**
 * Logout user - destroys session
 * @param {Object} req - Express request object
 * @param {Function} callback - Callback function
 */
const logoutUser = (req, callback) => {
    req.session.destroy((err) => {
        if (callback) {
            callback(err);
        }
    });
};

/**
 * Refresh session expiry
 * Extends the session lifetime on user activity
 */
const refreshSession = (req, res, next) => {
    if (req.session && req.session.user) {
        req.session.touch();
    }
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    hasRole,
    optionalAuth,
    loginUser,
    logoutUser,
    refreshSession
};
