const jwt = require('../config/jwt');
const { verifyToken } = jwt.jwt;


exports.authenticate = (req, res, next) => {
  try {

    
    // Check for token in cookies first
    let token = req.cookies?.jwt;
    
    // If not in cookies, check Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      message: 'Authentication failed', 
      error: error.message 
    });
  }
};