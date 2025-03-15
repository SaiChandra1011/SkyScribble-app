# SkyScribble - Airline Review Application

SkyScribble is a platform where users can browse, create, and manage airline reviews.

## Project Overview

This full-stack application allows users to:
- Browse airline reviews
- Create new airlines 
- Submit detailed reviews with ratings
- Edit and delete their own reviews
- Sign in with Google authentication

## Latest Updates

- Updated database connection to use Transaction Pooler for improved IPv4 compatibility
- Enhanced error handling for database connections
- Added better environment configuration for Render deployment

<!-- This comment will trigger a new deployment on Vercel -->

## Technologies Used

- **Frontend**: React, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Firebase Auth
- **Deployment**: Vercel (frontend), Render (backend)

## Features

- User authentication with Google Firebase
- Create and browse airline listings
- Read and write detailed reviews with ratings
- Upload images for reviews
- Responsive design for all devices

## Deployment Guide

This guide will help you deploy the SkyScribble application to free hosting platforms.

### 1. Database Deployment with Supabase

1. **Create a Supabase Account**:
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project with a name like "airline-reviews"
   - Set a secure database password
   - Choose the free tier

2. **Set Up Database Schema**:
   - In the Supabase dashboard, go to "SQL Editor"
   - Create a new query and paste the schema from `database/schema.sql`
   - Run the query to create all required tables

3. **Get Connection Details**:
   - Go to Project Settings > Database
   - Copy the connection string or note the individual parameters:
     - Host: db.XXXXXXXXXXXX.supabase.co
     - Port: 5432
     - Database: postgres
     - User: postgres
     - Password: (your password)

### 2. Backend Deployment on Render

1. **Prepare Your Repository**:
   - Make sure your code is in a GitHub repository
   - Ensure you have committed the following files:
     - `Procfile`
     - `.env.render` (template for environment variables)
     - Updated `server.js` and `db.js`

2. **Sign Up on Render**:
   - Create an account at [render.com](https://render.com)
   - Choose "New Web Service"
   - Connect your GitHub repository

3. **Configure the Web Service**:
   - **Name**: skyscribble-api (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - Choose the free plan

4. **Environment Variables**:
   - In the Render dashboard, add these environment variables:
     - `NODE_ENV`: production
     - `PORT`: 10000 (Render will override this with its own)
     - `PGUSER`: postgres
     - `PGHOST`: db.YOUR_SUPABASE_PROJECT_ID.supabase.co
     - `PGPASSWORD`: your-supabase-password
     - `PGDATABASE`: postgres
     - `PGPORT`: 5432
     - `DATABASE_URL`: postgresql://postgres:your-supabase-password@db.YOUR_SUPABASE_PROJECT_ID.supabase.co:5432/postgres
     - `FIREBASE_API_KEY`: (your Firebase API key)
     - `FIREBASE_AUTH_DOMAIN`: (your Firebase auth domain)
     - All other Firebase variables from your .env file
     - `CORS_ORIGIN`: https://your-frontend-url.netlify.app

5. **Deploy the Service**:
   - Click "Create Web Service"
   - Wait for the build and deployment to complete
   - Note the service URL (e.g., https://skyscribble-api.onrender.com)

### 3. Frontend Deployment on Netlify

1. **Update Production Environment**:
   - Edit `.env.production` in your project:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   # Add all other Firebase variables
   ```

2. **Build Your Frontend**:
   - Run `npm run build` to create a production build

3. **Sign Up on Netlify**:
   - Create an account at [netlify.com](https://netlify.com)
   - Go to "Sites" and drag-and-drop your `dist` folder
   - Or connect your GitHub repository and configure:
     - **Build Command**: `npm run build`
     - **Publish Directory**: `dist`

4. **Environment Variables**:
   - In the Netlify dashboard, go to Site settings > Build & deploy > Environment
   - Add the same variables from your `.env.production` file

5. **Configure Redirects**:
   - Create a `_redirects` file in the `public` folder:
   ```
   /*    /index.html   200
   ```
   - This ensures React Router works correctly

6. **Deploy the Site**:
   - Wait for deployment to complete
   - Your site will be available at a Netlify URL (e.g., skyscribble.netlify.app)

### 4. Connect Everything

1. **Update CORS on Backend**:
   - Once you have your frontend URL, update the CORS_ORIGIN variable in your Render environment:
   ```
   CORS_ORIGIN=https://your-frontend-url.netlify.app
   ```

2. **Test the Full Application**:
   - Visit your Netlify URL
   - Try signing in, viewing airlines, and creating reviews
   - Check that images upload correctly and reviews display properly

3. **Custom Domain (Optional)**:
   - If you have a custom domain, configure it in Netlify's settings

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Set up a local PostgreSQL database
5. Run the database setup: `npm run setup-db`
6. Start the development server: `npm run dev:full`

## License

MIT

## Contributors

- Your Name
