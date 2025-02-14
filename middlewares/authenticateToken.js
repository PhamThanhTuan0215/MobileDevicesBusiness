const jwt = require('jsonwebtoken');

const authenticateToken = (requiredRoles) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is missing or invalid.'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Token is invalid or expired.'
                });
            }

            // Kiểm tra quyền hạn
            if (requiredRoles && !requiredRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this resource.'
                });
            }

            req.user = user; // Gắn thông tin người dùng vào request
            next();
        });
    };
};

module.exports = authenticateToken;