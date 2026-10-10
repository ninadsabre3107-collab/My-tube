const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = async (req , res , next)=>{
    try {
        const token = await req.headers.authorization.split(" ")[1];
        jwt.verify(token , process.env.SECRET_KEY);
        next();
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error:'invalid token'
        })
        
        
    }
}