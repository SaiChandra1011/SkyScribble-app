-- Create database (run this separately in pgAdmin or psql)
-- CREATE DATABASE airline_reviews;

-- Connect to the database
-- \c airline_reviews;

-- Users table (for Google Authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Airlines table
CREATE TABLE airlines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE reviews (
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

-- Sample data for airlines
INSERT INTO airlines (name, logo_url) VALUES
('Delta Air Lines', 'https://example.com/delta-logo.png'),
('United Airlines', 'https://example.com/united-logo.png'),
('American Airlines', 'https://example.com/american-logo.png'),
('Southwest Airlines', 'https://example.com/southwest-logo.png'),
('British Airways', 'https://example.com/british-logo.png'); 