const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'opelcore-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

function generateToken(user) {
    return jwt.sign(
        { id: user._id, userId: user.userId, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
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
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            // Token invalid, continue without user
        }
    }
    next();
}

module.exports = { generateToken, authMiddleware, optionalAuth, JWT_SECRET };
