# Airline Review Application

A modern web application for airline reviews with Google Authentication and PostgreSQL database.

## Features

- Modern and simple UI with Framer Motion animations
- Google Authentication
- Airline listings with average ratings
- Detailed airline reviews
- PostgreSQL database integration

## Tech Stack

- React (Frontend)
- Framer Motion (Animations)
- Firebase (Authentication)
- PostgreSQL (Database)
- Express (Backend)

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your:
   - Firebase configuration
   - PostgreSQL database credentials

4. Set up the PostgreSQL database:
   - Create a new database
   - Run the SQL schema provided in `database/schema.sql`

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # Page components
├── services/      # API and authentication services
├── config/        # Configuration files
└── assets/        # Static assets
```

## Database Schema

The application uses three main tables:
- `users`: Stores user information from Google Authentication
- `airlines`: Stores airline information
- `reviews`: Stores user reviews for airlines

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
