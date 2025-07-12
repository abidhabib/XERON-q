const { pool } = require('../config/db');
const jwt = require('../config/jwt');
const { generateToken } = jwt.jwt;
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Check user exists
    const [rows] = await pool.query('SELECT * FROM subadmins WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = rows[0];
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      console.log('Password does not match');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = generateToken({
      id: user.id,
      username: user.username,
      task: user.task
    });
    
    // Set cookie with cross-origin support
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
      domain: isProduction ? '.yourdomain.com' : undefined // Don't set domain in development
    };
    
    console.log('Setting cookie with options:', JSON.stringify(cookieOptions, null, 2));
    
    // Set CORS headers before sending response
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization');
    
    // Set the JWT cookie
    res.cookie('jwt', token, cookieOptions);
    
    // Send success response with user data and token (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    console.log('Login successful, sending response');
    
    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token: token // Include the token in the response body
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ... rest of the code remains the same ...

exports.logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    domain: isProduction ? '.yourdomain.com' : 'localhost',
    path: '/'
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

exports.getProfile = (req, res) => {
  res.json(req.user);
};

// Temporary endpoint to reset password (remove in production)
exports.resetPassword = async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    
    if (!username || !newPassword) {
      return res.status(400).json({ message: 'Username and newPassword are required' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password in the database
    const [result] = await pool.query(
      'UPDATE subadmins SET password = ? WHERE username = ?',
      [hashedPassword, username]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};