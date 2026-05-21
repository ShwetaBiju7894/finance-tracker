const { Pool } = require('pg');
require('dotenv').config();

// Pool keeps a set of open database connections
// so we don't open a new one on every request
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test the connection when the server starts
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    client.release(); // return connection back to the pool
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1); // stop the server if DB can't connect
  }
};

module.exports = { pool, connectDB };