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

// Force PostgreSQL driver to use IPv4 instead of IPv6
process.env.PGSSLMODE = process.env.PGSSLMODE || 'require';

// Configure connection options
let poolConfig;

// Check if we have a DATABASE_URL (for Render.com or Heroku)
if (process.env.DATABASE_URL) {
  console.log('DB: Using DATABASE_URL for connection');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Supabase and most cloud PostgreSQL providers
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

// Add common settings with better timeouts and connection handling
poolConfig.connectionTimeoutMillis = 20000; // 20 seconds
poolConfig.max = 10; // Max 10 clients in pool
poolConfig.idleTimeoutMillis = 30000; // Close idle clients after 30 seconds
poolConfig.allowExitOnIdle = true; // Allow cleanup on app exit

console.log('DB: Connecting to', poolConfig.connectionString ? 'database via connection string' : poolConfig.host);

// Create the connection pool with enhanced error handling
const pool = new Pool(poolConfig);

// Add robust error listener for pool-level errors
pool.on('error', (err, client) => {
  console.error('DB: Unexpected error on idle client', err);
  if (process.env.NODE_ENV !== 'production') {
    console.error('DB: Error details:', err.stack);
    console.error('DB: This is a non-production environment, exiting process');
    process.exit(-1);
  } else {
    console.error('DB: In production environment, trying to keep application running');
    // In production we log but don't crash the app
  }
});

// Test the database connection with retry logic
const testConnection = async (retries = 3, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`DB: Connection attempt ${attempt}/${retries}`);
      const res = await pool.query('SELECT NOW()');
      console.log('DB: Successfully connected to PostgreSQL');
      console.log('DB: Server time:', res.rows[0].now);
      return true;
    } catch (err) {
      console.error(`DB: Connection attempt ${attempt} failed:`, err.message);
      
      if (attempt < retries) {
        console.log(`DB: Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('DB: All connection attempts failed.');
        console.error('DB: Check your database credentials, network, and ensure PostgreSQL is running');
        console.error('DB: Detailed error:', err);
      }
    }
  }
  return false;
};

// Execute the test connection
testConnection();

export default pool; 