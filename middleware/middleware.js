const jwt = require('jsonwebtoken');
const userList = require('../Models/CitUserModels');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        const token = req.cookies.usertoken || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Find user only in employee list
        const user = await userList.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Access denied. Not an employee.' });
        }

        req.user = user;
        // req.role = 'employee';
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;
