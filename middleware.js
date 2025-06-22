const jwt = require('jsonwebtoken');
function verifyToken(req,res,next){
    if(!req.headers.authorization){
        res.json({message:'unauthorization request 1'})
    }
    let token = req.headers.authorization.split(' ')[1]
    if(token===''){
        res.json({message:'token is empty '})
    }
    let payload = jwt.verify(token,'secretKey')
    if(!payload) {
        res.json({message:'unauthorized request3'})
    }
    //req.userId= payload.subject;
     //req.email=payload.email;
     req.user=payload;
    next()
}
module.exports = verifyToken;