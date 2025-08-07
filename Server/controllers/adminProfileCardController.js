// controllers/adminProfileCardController.js
import AdminProfileCard from '../models/AdminProfileCard.js';
import crypto from 'crypto';
import con from '../config/db.js';

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
    // Removed console.log

    try {
      // Check if user is admin
      // IMPORTANT: You need to implement this check based on your auth system.
      // Example:
      // if (!req.user || !req.user.role || req.user.role !== 'admin') {
      //   return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      // }

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
      // IMPORTANT: Implement this check.
      // Example:
      // if (!req.user || !req.user.role || req.user.role !== 'admin') {
      //   return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      // }

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
      // IMPORTANT: Implement this check.
      // Example:
      // if (!req.user || !req.user.role || req.user.role !== 'admin') {
      //   return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      // }

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
  } // <-- No comma here

  // --- NEW: Generate Encrypted Link Token (Admin only) ---
  static async generatePublicLink(req, res) {
    try {
      // Ensure only admins can generate links (IMPLEMENT THIS CHECK)
      // Example:
      // if (!req.user || !req.user.role || req.user.role !== 'admin') {
      //   return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      // }

      // Generate a unique, secure token
      const token = crypto.randomBytes(32).toString('hex');

      // Set expiration (e.g., 24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Store the token in the database
      const query = 'INSERT INTO admin_profile_tokens (token, expires_at) VALUES (?, ?)';
      // Assuming req.user.id exists from your auth middleware
      con.query(query, [token, expiresAt], (err, result) => { // Use req.user.id or default
        if (err) {
          console.error('Error saving token to database:', err);
          return res.status(500).json({ error: 'Failed to generate link.' });
        }

        // Construct the public URL using your frontend URL
        const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const publicUrl = `${frontendBaseUrl}/admin-profile/${token}`; // Define your desired path

        res.status(201).json({
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
  // Note: This is defined as a static property assigned an arrow function
  static validatePublicToken = (req, res, next) => {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token is required.' });
    }

    const query = 'SELECT * FROM admin_profile_tokens WHERE token = ? AND expires_at > NOW()';
    con.query(query, [token], (err, results) => {
      if (err) {
        console.error('Database error validating token:', err);
        return res.status(500).json({ error: 'Internal server error during token validation.' });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
      }

      // Token is valid, proceed to the next middleware/controller
      next();
    });
  }
}

export default AdminProfileCardController;