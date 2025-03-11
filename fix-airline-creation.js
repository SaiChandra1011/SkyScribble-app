import pg from 'pg';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Connection settings
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test API connection
async function testAPIConnection() {
  try {
    console.log('Testing API connection...');
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('API connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('API connection failed:', error.message);
    return false;
  }
}

// Verify the airlines table structure
async function verifyAirlinesTable() {
  console.log('Verifying airlines table structure...');
  
  try {
    // Check if table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'airlines'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('Airlines table does not exist!');
      return false;
    }
    
    console.log('Airlines table exists.');
    
    // Check table columns
    const columnsCheck = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'airlines';
    `);
    
    console.log('Airlines table columns:');
    columnsCheck.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Check constraints
    const constraintsCheck = await db.query(`
      SELECT con.conname AS constraint_name, 
             con.contype AS constraint_type,
             pg_get_constraintdef(con.oid) AS constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'airlines'
      AND nsp.nspname = 'public';
    `);
    
    console.log('Airlines table constraints:');
    constraintsCheck.rows.forEach(con => {
      console.log(`- ${con.constraint_name} (${con.constraint_type}): ${con.constraint_definition}`);
    });
    
    // Check for existing airlines
    const airlinesCheck = await db.query('SELECT id, name FROM airlines ORDER BY id');
    
    console.log('Existing airlines:');
    if (airlinesCheck.rows.length === 0) {
      console.log('No airlines found in the table.');
    } else {
      airlinesCheck.rows.forEach(airline => {
        console.log(`- ID: ${airline.id}, Name: ${airline.name}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying airlines table:', error);
    return false;
  }
}

// Try to create a new airline via API
async function testCreateAirline() {
  try {
    console.log('Testing airline creation via API...');
    
    // Generate a unique name to avoid conflicts
    const testName = `Test Airline ${Date.now()}`;
    
    console.log(`Attempting to create airline with name: "${testName}"`);
    
    const response = await axios.post('http://localhost:5000/api/airlines', 
      { name: testName },
      { 
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('API response status:', response.status);
    console.log('API response data:', response.data);
    
    // Verify in database
    const dbCheck = await db.query('SELECT * FROM airlines WHERE name = $1', [testName]);
    
    if (dbCheck.rows.length > 0) {
      console.log('Database verification successful. Airline created:', dbCheck.rows[0]);
      return true;
    } else {
      console.error('Database verification failed. Airline not found in database.');
      return false;
    }
  } catch (error) {
    console.error('Error testing airline creation:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return false;
  }
}

// Main function
async function main() {
  try {
    // Check API connection
    const apiConnected = await testAPIConnection();
    if (!apiConnected) {
      console.error('Could not connect to API. Make sure the server is running.');
      process.exit(1);
    }
    
    // Verify table structure
    const tableVerified = await verifyAirlinesTable();
    if (!tableVerified) {
      console.error('Airlines table verification failed.');
      process.exit(1);
    }
    
    // Test airline creation
    const creationTested = await testCreateAirline();
    if (!creationTested) {
      console.error('Airline creation test failed.');
      process.exit(1);
    }
    
    console.log('\nAll tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run the main function
main(); 