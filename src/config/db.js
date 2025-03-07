import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Create a new database connection pool with explicit configuration
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'airline_reviews',
  password: process.env.PGPASSWORD || 'Datawork10!',
  port: parseInt(process.env.PGPORT || '5432', 10),
  // Add connection timeout
  connectionTimeoutMillis: 5000,
});

// Test the database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Database connection successful:', res.rows[0].now);
  }
});

export default pool; 