require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

async function checkUser(username) {
  try {
    const [rows] = await pool.query('SELECT id, username, password FROM subadmins WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      console.log('User not found');
      return null;
    }
    
    const user = rows[0];
    console.log('User found:');
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Password Hash: ${user.password}`);
    
    return user;
  } catch (error) {
    console.error('Error checking user:', error);
    return null;
  }
}

// Usage: node checkUser.js <username>
const username = process.argv[2];
if (!username) {
  console.log('Usage: node checkUser.js <username>');
  process.exit(1);
}

checkUser(username)
  .then(() => process.exit(0));
