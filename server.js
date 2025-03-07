const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  // Connection details will be read from environment variables:
  // PGUSER, PGHOST, PGPASSWORD, PGDATABASE, PGPORT
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to PostgreSQL database at:', res.rows[0].now);
  }
});

// Routes
app.get('/api/airlines', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.name, a.logo_url, 
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as review_count
      FROM airlines a
      LEFT JOIN reviews r ON a.id = r.airline_id
      GROUP BY a.id, a.name, a.logo_url
      ORDER BY a.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching airlines:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/airlines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const airlineResult = await pool.query('SELECT * FROM airlines WHERE id = $1', [id]);
    
    if (airlineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Airline not found' });
    }
    
    const reviewsResult = await pool.query(`
      SELECT r.*, u.display_name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.airline_id = $1
      ORDER BY r.created_at DESC
    `, [id]);
    
    res.json({
      airline: airlineResult.rows[0],
      reviews: reviewsResult.rows
    });
  } catch (error) {
    console.error('Error fetching airline details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get review details
app.get('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*, u.display_name as user_name, a.name as airline_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN airlines a ON r.airline_id = a.id
      WHERE r.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching review details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new user or get existing user from Google Auth
app.post('/api/users', async (req, res) => {
  try {
    const { google_id, email, display_name } = req.body;
    
    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE google_id = $1', [google_id]);
    
    if (userCheck.rows.length > 0) {
      // User exists, return user data
      return res.json(userCheck.rows[0]);
    }
    
    // User doesn't exist, create new user
    const newUser = await pool.query(
      'INSERT INTO users (google_id, email, display_name) VALUES ($1, $2, $3) RETURNING *',
      [google_id, email, display_name]
    );
    
    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error('Error with user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new review
app.post('/api/reviews', async (req, res) => {
  try {
    const { 
      user_id, 
      airline_id, 
      departure_city, 
      arrival_city, 
      rating, 
      heading, 
      description, 
      image_url 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO reviews 
        (user_id, airline_id, departure_city, arrival_city, rating, heading, description, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [user_id, airline_id, departure_city, arrival_city, rating, heading, description, image_url || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 