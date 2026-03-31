const jwt = require('jsonwebtoken');
const config = require('./config');

function generateToken(user) {
    return jwt.sign(
        { id: user._id, userId: user.userId, username: user.username },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
    );
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

// Optional auth - doesn't reject if no token, but attaches user if present
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            req.user = jwt.verify(token, config.JWT_SECRET);
        } catch (e) {
            // Token invalid, continue without user
        }
    }
    next();
}

module.exports = { generateToken, authMiddleware, optionalAuth };
