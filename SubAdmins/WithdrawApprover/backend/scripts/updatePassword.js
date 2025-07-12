require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function updatePassword(username, newPassword) {
  try {
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password in the database
    const [result] = await pool.query(
      'UPDATE subadmins SET password = ? WHERE username = ?',
      [hashedPassword, username]
    );
    
    if (result.affectedRows === 0) {
      console.error('User not found');
      return false;
    }
    
    console.log(`Password updated successfully for user: ${username}`);
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

// Usage: node updatePassword.js <username> <newPassword>
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node updatePassword.js <username> <newPassword>');
  process.exit(1);
}

const [username, newPassword] = args;
updatePassword(username, newPassword)
  .then(success => {
    if (success) {
      console.log('Password update completed successfully');
    } else {
      console.log('Password update failed');
    }
    process.exit(0);
  });
