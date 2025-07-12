const jwt = require('jsonwebtoken');
// function verifyToken(req,res,next){
//     if(!req.headers.authorization){
//         res.json({message:'unauthorization request 1'})
//     }
//     let token = req.headers.authorization.split(' ')[1]
//     if(token===''){
//         res.json({message:'token is empty '})
//     }
//     let payload = jwt.verify(token,'secretKey')
//     if(!payload) {
//         res.json({message:'unauthorized request3'})
//     }
//     //req.userId= payload.subject;
//      //req.email=payload.email;
//      req.user=payload;
//     next()
// }

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    // Check if authorization header exists
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized request: No Authorization header' });
    }

    // Split and validate "Bearer <token>" format
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Unauthorized request: Malformed token format' });
    }

    const token = tokenParts[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized request: Token is empty' });
    }

    try {
        const payload = jwt.verify(token, 'secretKey');
        if (!payload) {
            return res.status(401).json({ message: 'Unauthorized request: Invalid payload' });
        }

        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized request: Invalid or expired token', error: err.message });
    }
}

module.exports = verifyToken;