import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

async function testDatabase() {
  console.log('Testing database connection...');
  
  const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'airline_reviews',
    password: process.env.PGPASSWORD || 'Datawork10!',
    port: parseInt(process.env.PGPORT || '5432', 10),
  });
  
  try {
    // Test basic connection
    const connectionResult = await pool.query('SELECT NOW() as time');
    console.log('✅ Database connection successful');
    console.log('Current database time:', connectionResult.rows[0].time);
    
    // Check if airlines table exists
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\nTables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check airlines table content
    const airlinesResult = await pool.query(`
      SELECT * FROM airlines
    `);
    
    console.log(`\nFound ${airlinesResult.rows.length} airlines in database:`);
    airlinesResult.rows.forEach(airline => {
      console.log(`- ID: ${airline.id}, Name: ${airline.name}`);
    });
    
    // Check the query used in the application
    const appQueryResult = await pool.query(`
      SELECT a.id, a.name, a.logo_url,
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as review_count
      FROM airlines a
      LEFT JOIN reviews r ON a.id = r.airline_id
      GROUP BY a.id
      ORDER BY a.name ASC
    `);
    
    console.log(`\nApplication query returned ${appQueryResult.rows.length} airlines:`);
    appQueryResult.rows.forEach(airline => {
      console.log(`- ID: ${airline.id}, Name: ${airline.name}, Rating: ${airline.average_rating}, Reviews: ${airline.review_count}`);
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
testDatabase().catch(console.error); 