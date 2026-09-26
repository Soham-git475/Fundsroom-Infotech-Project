const jwt = require('jsonwebtoken');

// 1. Verify if the user is logged in (Valid Token)
const authenticate = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Expects "Bearer <token>"
    if (!token) {
        return res.status(401).json({ error: 'Access denied. Invalid token format.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach payload (id, role) to the request object
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// 2. Verify if the user has the correct role (ADMIN or SALES_USER)
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden. You do not have permission to perform this action.' });
        }
        next();
    };
};

module.exports = { authenticate, authorize };