const mysql = require('mysql2/promise'); // Use promise-based version

const createPool = () => {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
};

// Create the pool immediately
const pool = createPool();

// Test connection function
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to database');
    connection.release();
    return true;
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};