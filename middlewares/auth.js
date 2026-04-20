const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/config');
const User = require('../models/userModel');

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "No token"});
        }
        // if the token is present, verify it
        const decoded = jwt.verify(token, JWT_SECRET);

        // if the token is valid, attach the user ID to the request object
        req.userId = decoded.userId; 
        req.role = decoded.role;
        // call the next middleware or route handler
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const allowRoles = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};

module.exports = {
    isAuthenticated,
    allowRoles
}