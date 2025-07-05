require('dotenv').config();
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    // 1. Check Authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ 
            success: false,
            message: 'Authorization header is required',
            code: 'MISSING_AUTH_HEADER'
        });
    }

    // 2. Validate "Bearer <token>" format
    const tokenParts = authHeader.split(' ');
    
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ 
            success: false,
            message: 'Invalid token format. Expected: Bearer <token>',
            code: 'INVALID_TOKEN_FORMAT'
        });
    }

    const token = tokenParts[1];

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Token cannot be empty',
            code: 'EMPTY_TOKEN'
        });
    }

    // 3. Verify token
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            let message = 'Invalid token';
            let code = 'INVALID_TOKEN';
            
            if (err.name === 'TokenExpiredError') {
                message = 'Token expired';
                code = 'TOKEN_EXPIRED';
            } else if (err.name === 'JsonWebTokenError') {
                message = 'Malformed token';
                code = 'MALFORMED_TOKEN';
            }
            
            return res.status(401).json({ 
                success: false,
                message,
                code,
                expiredAt: err.expiredAt // Only for TokenExpiredError
            });
        }

        // 4. Attach user data to request
        req.user = decoded;
        next();
    });
}

module.exports = verifyToken;