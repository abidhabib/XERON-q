// models/AdminProfileCard.js
import con from '../config/db.js';

class AdminProfileCard {
  // Get public admin profile (single card for entire system)
  static async getPublicProfile() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM admin_profile_card 
        WHERE id = 1 AND is_active = 1
        LIMIT 1
      `;
      con.query(query, (err, results) => {
        if (err) reject(err);
        resolve(results[0]);
      });
    });
  }

  // Get admin social links
  static async getSocialLinks() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM admin_social_links 
        WHERE is_active = 1 
        ORDER BY display_order ASC
      `;
      con.query(query, (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  }

  // Get complete public profile data
  static async getCompletePublicProfile() {
    try {
      const profile = await this.getPublicProfile();
      if (!profile) {
        return null;
      }
      
      const socialLinks = await this.getSocialLinks();
      
      return {
        profile,
        socialLinks
      };
    } catch (error) {
      throw error;
    }
  }

  // Update admin profile (admin only)
  static async updateProfile(data) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE admin_profile_card 
        SET full_name = ?, title = ?, profile_image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `;
      con.query(query, [data.fullName, data.title, data.profileImageUrl], (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  }

  // Update social links (admin only)
  static async updateSocialLinks(socialLinks) {
    return new Promise(async (resolve, reject) => {
      try {
        // Delete existing links
        await new Promise((resolve, reject) => {
          con.query('DELETE FROM admin_social_links', (err) => {
            if (err) reject(err);
            resolve();
          });
        });

        // Insert new links
        if (socialLinks && socialLinks.length > 0) {
          const values = socialLinks.map((link, index) => [
            link.name,
            link.icon,
            link.color,
            link.href,
            index
          ]);
          
          const query = `
            INSERT INTO admin_social_links 
            (platform_name, icon_name, color_class, url, display_order) 
            VALUES ?
          `;
          
          con.query(query, [values], (err) => {
            if (err) reject(err);
            resolve();
          });
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // Reset to default values
  static async resetToDefault() {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE admin_profile_card 
        SET full_name = 'Admin User', 
            title = 'System Administrator', 
            profile_image_url = '/uploads/default-admin.png',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `;
      con.query(query, (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
  }
}

export default AdminProfileCard;