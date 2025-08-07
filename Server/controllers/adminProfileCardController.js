// controllers/adminProfileCardController.js
import AdminProfileCard from '../models/AdminProfileCard.js';


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
    console.log(req);
    
    try {
      // Check if user is admin
    

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
}

export default AdminProfileCardController;