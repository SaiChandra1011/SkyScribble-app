import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on NODE_ENV
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});

const { Pool } = pg;

console.log('DB: Initializing database connection');
console.log('DB: Environment:', process.env.NODE_ENV || 'development');

// Configure connection options
let poolConfig;

// Check if we have a DATABASE_URL (for Render.com or Heroku)
if (process.env.DATABASE_URL) {
  console.log('DB: Using DATABASE_URL for connection');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for some hosting providers
    }
  };
} else {
  // Use individual connection parameters otherwise
  console.log('DB: Using individual connection parameters');
  poolConfig = {
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'airline_reviews',
    password: process.env.PGPASSWORD || 'Datawork10!',
    port: parseInt(process.env.PGPORT || '5432', 10),
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  };
}

// Add common settings
poolConfig.connectionTimeoutMillis = 10000; // 10 seconds
poolConfig.max = 20; // Max 20 clients in pool

console.log('DB: Connecting to', poolConfig.host || 'database via connection string');

// Create the connection pool
const pool = new Pool(poolConfig);

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
  // Don't exit the process in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

export default pool; 