require('dotenv').config({ path: '.env' });

console.log('Environment Variables:');
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_USER: ${process.env.DB_USER}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '*** (set)' : 'Not set');

const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Successfully connected to the database!');
    
    // Try to query the users table
    const [rows] = await connection.execute('SELECT * FROM subadmins');
    console.log(`Found ${rows.length} users in subadmins table`);
    
    if (rows.length > 0) {
      console.log('First user:', {
        id: rows[0].id,
        username: rows[0].username,
        password_hash_length: rows[0].password ? rows[0].password.length : 0
      });
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

testConnection().then(success => {
  console.log(success ? 'Test completed successfully' : 'Test failed');
  process.exit(success ? 0 : 1);
});
