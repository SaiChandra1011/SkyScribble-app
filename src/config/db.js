import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

console.log('DB: Initializing database connection');
console.log('DB: Environment:', process.env.NODE_ENV);

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
pool.query('SELECT NOW()')
  .then(res => {
    console.log('DB: Successfully connected to PostgreSQL');
    console.log('DB: Server time:', res.rows[0].now);
  })
  .catch(err => {
    console.error('DB: Error connecting to PostgreSQL:', err.message);
    console.error('DB: Check your database credentials and ensure PostgreSQL is running');
  });

// Add error handler
pool.on('error', (err) => {
  console.error('DB: Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool; 