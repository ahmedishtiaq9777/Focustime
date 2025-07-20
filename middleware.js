const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;



const authenticateToken=(req,res,next)=>
{
    console.log('middlewhere');
const authHeader=req.headers['authorization'];
const token=authHeader && authHeader.split(' ')[1];
if(token) console.log('token:',token)
if (!token) return res.sendStatus(401);
jwt.verify(token,SECRET_KEY,(err,user)=>{
    console.log('inside');
     if (err) return res.sendStatus(403);
    req.user = user;
    next();

});
}
module.exports = authenticateToken;