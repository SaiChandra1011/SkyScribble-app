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

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 