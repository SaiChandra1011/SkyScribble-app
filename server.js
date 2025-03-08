import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './src/config/db.js';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import pkg from 'pg';
const { Pool } = pkg;

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'image-' + uniqueSuffix + ext);
  }
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit (reduced from 5MB)
  }
});

// Custom error handler for multer errors
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large', 
        message: 'Image must be less than 2MB in size' 
      });
    }
  }
  next(err);
};

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-url.vercel.app', 'https://skyscribbler.com'] 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add health endpoint for API discovery
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString() 
  });
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
      GROUP BY a.id
      ORDER BY a.name ASC
    `);
    
    console.log('Fetched airlines:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching airlines:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new airline
app.post('/api/airlines', async (req, res) => {
  try {
    console.log('Server: Received airline data:', req.body);
    const { name } = req.body;
    
    if (!name) {
      console.error('Server: Missing required field: name');
      return res.status(400).json({ error: 'Missing required field: name is required' });
    }
    
    // Create new airline
    const result = await pool.query(
      'INSERT INTO airlines (name) VALUES ($1) RETURNING *',
      [name]
    );
    
    console.log('Server: New airline created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Server: Error creating airline:', error);
    
    // Check for duplicate name error
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'An airline with this name already exists', code: '23505' });
    }
    
    // Provide more specific error feedback
    if (error.code === '28P01') { // Invalid password authentication
      return res.status(500).json({ error: 'Database authentication failed', message: 'Contact administrator' });
    }
    
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Get details for a specific airline including its reviews
app.get('/api/airlines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get airline details
    const airlineResult = await pool.query('SELECT * FROM airlines WHERE id = $1', [id]);
    
    if (airlineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Airline not found' });
    }
    
    const airline = airlineResult.rows[0];
    
    // Get reviews for this airline, sorted by creation date (newest first)
    const reviewsResult = await pool.query(`
      SELECT r.*, u.display_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.airline_id = $1
      ORDER BY r.created_at DESC
    `, [id]);
    
    // Filter out any potential duplicate reviews (same heading and user_id)
    const uniqueReviews = [];
    const seen = new Map();
    
    for (const review of reviewsResult.rows) {
      // Create a unique key for the review
      const key = `${review.user_id}:${review.heading}`;
      
      if (!seen.has(key)) {
        seen.set(key, true);
        uniqueReviews.push(review);
      } else {
        console.log(`Filtered out duplicate review: ${review.heading} by user ${review.user_id}`);
      }
    }
    
    // Add reviews to airline object
    airline.reviews = uniqueReviews;
    
    // Calculate average rating
    if (uniqueReviews.length > 0) {
      const sum = uniqueReviews.reduce((acc, review) => acc + parseInt(review.rating), 0);
      airline.average_rating = (sum / uniqueReviews.length).toFixed(1);
    } else {
      airline.average_rating = 0;
    }
    
    res.json(airline);
  } catch (error) {
    console.error('Error fetching airline details:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
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
    
    console.log(`Fetched review ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching review details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new user or get existing user from Google Auth
app.post('/api/users', async (req, res) => {
  try {
    console.log('Server: Received user data:', req.body);
    const { google_id, email, display_name } = req.body;
    
    if (!google_id || !email) {
      console.error('Server: Missing required fields:', req.body);
      return res.status(400).json({ error: 'Missing required fields: google_id and email are required' });
    }
    
    // Check if user exists
    console.log('Server: Checking if user exists with google_id:', google_id);
    const userCheck = await pool.query('SELECT * FROM users WHERE google_id = $1', [google_id]);
    
    if (userCheck.rows.length > 0) {
      // User exists, return user data
      console.log('Server: User exists, returning:', userCheck.rows[0]);
      return res.json(userCheck.rows[0]);
    }
    
    // User doesn't exist, create new user
    console.log('Server: Creating new user with:', { google_id, email, display_name });
    const newUser = await pool.query(
      'INSERT INTO users (google_id, email, display_name) VALUES ($1, $2, $3) RETURNING *',
      [google_id, email, display_name || email.split('@')[0]]
    );
    
    console.log('Server: New user created:', newUser.rows[0]);
    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error('Server: Error with user operation:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Create a new review with file upload
app.post('/api/reviews', upload.single('image'), async (req, res) => {
  // Start a database transaction
  let client = null;
  
  try {
    client = await pool.connect();
    
    await client.query('BEGIN');
    
    console.log("Review creation request received");
    console.log("Request body:", req.body);
    console.log("File:", req.file);
    
    // Validate required fields with better error responses
    if (!req.body.airline_id) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Airline ID is required' });
    }
    
    // Ensure user_id is valid
    if (!req.body.user_id) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Ensure user_id is a valid integer
    const userId = parseInt(req.body.user_id, 10);
    if (isNaN(userId) || userId <= 0) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid User ID' });
    }
    
    if (!req.body.departure_city) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Departure city is required' });
    }
    if (!req.body.arrival_city) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Arrival city is required' });
    }
    if (!req.body.heading) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Review heading is required' });
    }
    if (!req.body.description) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Review description is required' });
    }
    if (!req.body.rating) {
      if (client) await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Rating is required' });
    }

    // Check if user exists
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if airline exists
    const airlineResult = await client.query('SELECT * FROM airlines WHERE id = $1', [req.body.airline_id]);
    if (airlineResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Airline not found' });
    }
    
    // Check for duplicate review (same user, airline, heading within last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const duplicateCheck = await client.query(
      `SELECT * FROM reviews 
       WHERE user_id = $1 
       AND airline_id = $2 
       AND heading = $3
       AND created_at > $4`,
      [userId, req.body.airline_id, req.body.heading, tenMinutesAgo]
    );
    
    if (duplicateCheck.rows.length > 0) {
      console.log('Duplicate review detected, returning existing review');
      await client.query('COMMIT');
      return res.status(200).json({
        ...duplicateCheck.rows[0],
        message: 'This review was already submitted',
        success: true
      });
    }

    let imageUrl = null;
    if (req.file) {
      // Handle file upload (if needed)
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Insert review into database
    const result = await client.query(
      'INSERT INTO reviews (user_id, airline_id, departure_city, arrival_city, rating, heading, description, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        userId, // Use the parsed integer
        req.body.airline_id,
        req.body.departure_city,
        req.body.arrival_city,
        req.body.rating,
        req.body.heading,
        req.body.description,
        imageUrl
      ]
    );

    // Commit the transaction
    await client.query('COMMIT');

    console.log("Review created successfully:", result.rows[0]);
    
    // Return a success response with review data
    res.status(201).json({
      ...result.rows[0],
      success: true
    });
  } catch (error) {
    // Rollback in case of error
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during transaction rollback:', rollbackError);
      }
    }
    
    console.error('Error creating review:', error);
    
    // Send a more helpful error message
    res.status(500).json({ 
      message: 'Error creating review. Please try again.', 
      error: error.message,
      success: false 
    });
  } finally {
    // Release the client back to the pool
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
});

// Update a review with file upload
app.put('/api/reviews/:id', upload.single('image'), handleMulterErrors, async (req, res) => {
  try {
    console.log('Server: Received update review request:', req.params.id, req.body);
    console.log('Server: Received file for update:', req.file);
    
    const reviewId = req.params.id;
    const { 
      user_id,
      departure_city,
      arrival_city,
      rating,
      heading,
      description,
      image_url
    } = req.body;
    
    // First check if the review exists and belongs to the user
    const checkResult = await pool.query(
      'SELECT * FROM reviews WHERE id = $1',
      [reviewId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const review = checkResult.rows[0];
    
    // Verify ownership
    if (parseInt(user_id) !== review.user_id) {
      return res.status(403).json({ error: 'You can only update your own reviews' });
    }
    
    // Determine the image URL to use
    let finalImageUrl = review.image_url; // Default to existing image
    
    if (req.file) {
      // New file was uploaded
      finalImageUrl = `/uploads/${req.file.filename}`;
    } else if (image_url) {
      // Use provided image URL (might be empty string to remove image)
      finalImageUrl = image_url;
    }
    
    // Update the review
    const result = await pool.query(
      `UPDATE reviews 
       SET departure_city = $1, 
           arrival_city = $2, 
           rating = $3, 
           heading = $4, 
           description = $5, 
           image_url = $6
       WHERE id = $7 
       RETURNING *`,
      [
        departure_city,
        arrival_city,
        rating,
        heading,
        description,
        finalImageUrl,
        reviewId
      ]
    );
    
    console.log('Server: Review updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Server: Error updating review:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Delete a review
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    console.log('Server: Received delete review request:', req.params.id, req.query);
    const { id } = req.params;
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'Missing required parameter: user_id' });
    }
    
    // First check if the review exists and belongs to the user
    const reviewCheck = await pool.query(
      'SELECT * FROM reviews WHERE id = $1', 
      [id]
    );
    
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const review = reviewCheck.rows[0];
    
    // Ensure the user owns this review
    if (review.user_id !== parseInt(user_id)) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }
    
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or not yours to delete' });
    }
    
    console.log('Server: Review deleted:', result.rows[0]);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Start the server
const startServer = (port) => {
  const server = http.createServer(app);
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please close the application using this port and try again.`);
      process.exit(1);
    } else {
      console.error('Server error:', error);
    }
  });
  
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`API URL: http://localhost:${port}/api`);
  });
  
  return server;
};

// Start the server with the defined PORT
startServer(PORT);

// Export for testing
export default app; 