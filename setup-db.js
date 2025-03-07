import dotenv from 'dotenv';
import pool from './src/config/db.js';

dotenv.config();

async function setupDatabase() {
  console.log('Checking database setup...');
  
  try {
    // Check if tables exist
    const tablesExist = await checkTablesExist();
    
    if (tablesExist) {
      console.log('Database tables already exist. No setup needed.');
      process.exit(0);
    } else {
      console.log('Creating database tables...');
      await createTables();
      console.log('Database setup completed successfully.');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    // Close the pool when done
    await pool.end();
  }
}

async function checkTablesExist() {
  try {
    // Check if users table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'users'
      );
    `);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking if tables exist:', error);
    throw error;
  }
}

async function createTables() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table created or already exists.');
    
    // Create airlines table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS airlines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        logo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Airlines table created or already exists.');
    
    // Create reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        airline_id INTEGER REFERENCES airlines(id),
        departure_city VARCHAR(255) NOT NULL,
        arrival_city VARCHAR(255) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        heading VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Reviews table created or already exists.');
    
    // Check if sample data needs to be added
    const airlineCount = await pool.query('SELECT COUNT(*) FROM airlines');
    
    if (parseInt(airlineCount.rows[0].count) === 0) {
      console.log('Adding sample airline data...');
      await pool.query(`
        INSERT INTO airlines (name, logo_url) VALUES
        ('Delta Air Lines', 'https://example.com/delta-logo.png'),
        ('United Airlines', 'https://example.com/united-logo.png'),
        ('American Airlines', 'https://example.com/american-logo.png'),
        ('Southwest Airlines', 'https://example.com/southwest-logo.png'),
        ('British Airways', 'https://example.com/british-logo.png');
      `);
      console.log('Sample airline data added.');
    }
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

setupDatabase(); 