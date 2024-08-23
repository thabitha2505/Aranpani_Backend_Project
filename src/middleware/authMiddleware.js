// authMiddleware.js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Expecting 'Bearer TOKEN'

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(400).json({ message: 'Invalid token.' });
  }
  
};



const restrict = (role)=>{
  return(req,res,next)=>{
    if(req.user.role !== role){
      const error = new Error('You do not have permission to perform this action');
      error.status = 403;
      return next(error);
    }
    next();

  }
}




module.exports = {protect,restrict};
