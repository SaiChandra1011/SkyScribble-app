import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './src/config/db.js';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

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
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add health endpoint for API discovery
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
    
    console.log(`Fetched airline ${id} with ${reviewsResult.rows.length} reviews`);
    
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
app.post('/api/reviews', upload.single('image'), handleMulterErrors, async (req, res) => {
  try {
    console.log('Server: Received review data:', req.body);
    console.log('Server: Received file:', req.file);
    
    const { 
      user_id, 
      airline_id, 
      departure_city, 
      arrival_city, 
      rating, 
      heading, 
      description
    } = req.body;
    
    if (!user_id || !airline_id || !departure_city || !arrival_city || !rating || !heading || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get the image URL if a file was uploaded
    let image_url = null;
    if (req.file) {
      // Use the path that can be accessed via the server
      image_url = `/uploads/${req.file.filename}`;
    }
    
    const result = await pool.query(
      `INSERT INTO reviews 
        (user_id, airline_id, departure_city, arrival_city, rating, heading, description, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [user_id, airline_id, departure_city, arrival_city, rating, heading, description, image_url]
    );
    
    console.log('Server: New review created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Server: Error creating review:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Function to try different ports if the chosen one is busy
const startServer = (port) => {
  const server = http.createServer(app);
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is in use, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', error);
    }
  });
  
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`API URL: http://localhost:${port}/api`);
  });
  
  // Handle server shutdown gracefully
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down server');
    server.close(() => {
      console.log('Server closed');
      pool.end().then(() => {
        console.log('Database pool closed');
        process.exit(0);
      });
    });
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    server.close(() => {
      pool.end().then(() => {
        process.exit(1);
      });
    });
  });
  
  return server;
};

// Start the server
startServer(PORT); 