// controllers/adminProfileCardController.js
import AdminProfileCard from '../models/AdminProfileCard.js';
import crypto from 'crypto'; // Import crypto for token generation
import con from '../config/db.js'; // Import your database connection

class AdminProfileCardController {
  // Get public admin profile (anyone can access)
  static async getPublicProfile(req, res) {
    try {
      const profileData = await AdminProfileCard.getCompletePublicProfile();
      
      if (!profileData) {
        return res.status(404).json({ error: 'Admin profile not found' });
      }

      res.json(profileData);
    } catch (error) {
      console.error('Get public profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get admin profile for editing (admin only)
  static async getAdminProfile(req, res) {
    // console.log(req); // Removed console.log
    
    try {
      // Check if user is admin (implement your admin check logic)
      // Example using req.user (assuming your middleware sets this)
      if (!req.user || !req.user.isAdmin) { // Adjust based on your user object structure
         return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const profileData = await AdminProfileCard.getCompletePublicProfile();
      
      res.json(profileData);
    } catch (error) {
      console.error('Get admin profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update admin profile (admin only)
  static async updateAdminProfile(req, res) {
    try {
      // Check if user is admin
       if (!req.user || !req.user.isAdmin) { // Adjust based on your user object structure
         return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { fullName, title, socialLinks, resetToDefault } = req.body;
      
      if (resetToDefault) {
        await AdminProfileCard.resetToDefault();
        return res.json({ message: 'Profile reset to default successfully' });
      }

      // Update profile info
      await AdminProfileCard.updateProfile({
        fullName: fullName || 'Admin User',
        title: title || 'System Administrator',
        profileImageUrl: req.body.profileImageUrl || '/uploads/default-admin.png'
      });

      // Update social links if provided
      if (socialLinks) {
        await AdminProfileCard.updateSocialLinks(socialLinks);
      }

      res.json({ message: 'Admin profile updated successfully' });
    } catch (error) {
      console.error('Update admin profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Upload admin profile image (admin only)
  static async uploadImage(req, res) {
    try {
      // Check if user is admin
       if (!req.user || !req.user.isAdmin) { // Adjust based on your user object structure
         return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      
      res.json({ 
        message: 'Image uploaded successfully',
        imageUrl 
      });
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  


  // --- NEW: Generate Encrypted Link Token (Admin only) ---
  static async generatePublicLink(req, res) {
    try {
      // Ensure only admins can generate links
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      // Generate a unique, secure token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration (e.g., 24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

      // Store the token in the database
      // Assuming `con` is your MySQL connection pool from '../config/db.js'
      const query = 'INSERT INTO admin_profile_tokens (token, expires_at, created_by) VALUES (?, ?, ?)';
      con.query(query, [token, expiresAt, req.user.id], (err, result) => { // Adjust user ID field if needed
        if (err) {
          console.error('Error saving token to database:', err);
          return res.status(500).json({ error: 'Failed to generate link.' });
        }

        // Construct the public URL using your frontend URL
        // Make sure to set FRONTEND_URL in your environment variables
        const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Fallback for development
        const publicUrl = `${frontendBaseUrl}/admin-profile/${token}`; // Define your desired path

        res.status(201).json({ // 201 Created is appropriate for resource creation
          success: true, 
          link: publicUrl, 
          token: token, 
          expiresAt: expiresAt 
        });
      });

    } catch (error) {
      console.error('Generate public link error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

  // --- NEW: Validate Token Middleware Function ---
  // This function checks if a token is valid and not expired
  // It's designed to be used as middleware in routes
  static validatePublicToken = (req, res, next) => {
    // Extract token, assuming it's passed in the URL path like /api/admin/public-profile/:token
    const { token } = req.params; 

    // Basic check for token presence
    if (!token) {
      return res.status(400).json({ error: 'Token is required.' });
    }

    // Query the database to find the token and check expiration
    // Using '?' placeholders for security (prevents SQL injection)
    const query = 'SELECT * FROM admin_profile_tokens WHERE token = ? AND expires_at > NOW()';
    con.query(query, [token], (err, results) => {
      if (err) {
        // Log the actual database error for debugging server-side
        console.error('Database error validating token:', err);
        return res.status(500).json({ error: 'Internal server error during token validation.' });
      }

      // Check if any valid (non-expired) token was found
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
      }

      // Token is valid!
      // You can attach token info to the request object if needed in subsequent middleware/controller
      // req.validatedToken = results[0]; 
      
      // Call next() to proceed to the next middleware or route handler
      next();
    });
  }

}

export default AdminProfileCardController;