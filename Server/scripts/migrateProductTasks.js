import mysql from 'mysql2';
import con from '../config/db.js';
import { createProductTaskSchemaInitializer } from '../services/productTaskSchema.js';

const pool = mysql.createPool({
  host: con.config.host, port: con.config.port, user: con.config.user,
  password: con.config.password, database: con.config.database, connectionLimit: 1,
}).promise();
try {
  await createProductTaskSchemaInitializer(pool)();
  console.log('Product-sharing columns are ready in the configured database.');
} catch (error) {
  console.error('Product-sharing schema setup failed:', error.code || error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
  await con.promise().end();
}
