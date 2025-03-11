import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

async function addUniqueConstraint() {
  console.log('Adding unique constraint to airlines table...');
  
  const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'airline_reviews',
    password: process.env.PGPASSWORD || 'Datawork10!',
    port: parseInt(process.env.PGPORT || '5432', 10),
  });
  
  try {
    // First check if the constraint already exists
    const checkConstraint = await pool.query(`
      SELECT conname
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE t.relname = 'airlines'
      AND n.nspname = 'public'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) LIKE '%name%'
    `);
    
    // Also check for unique indexes
    const checkIndex = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'airlines'
      AND schemaname = 'public'
      AND indexdef LIKE '%name%'
      AND indexdef LIKE '%UNIQUE%'
    `);
    
    if (checkConstraint.rows.length > 0 || checkIndex.rows.length > 0) {
      console.log('Unique constraint or index already exists:');
      checkConstraint.rows.forEach(row => {
        console.log(`- Constraint: ${row.conname}`);
      });
      checkIndex.rows.forEach(row => {
        console.log(`- Index: ${row.indexname}`);
      });
      console.log('No need to add another constraint.');
    } else {
      // Add the unique constraint
      console.log('No unique constraint found. Adding one...');
      
      // Check for duplicates first
      const duplicateCheck = await pool.query(`
        SELECT COUNT(*) as count, name
        FROM airlines
        GROUP BY name
        HAVING COUNT(*) > 1
      `);
      
      if (duplicateCheck.rows.length > 0) {
        console.log('⚠️ Cannot add unique constraint - duplicate airline names found:');
        duplicateCheck.rows.forEach(row => {
          console.log(`- "${row.name}" appears ${row.count} times`);
        });
        
        console.log('\nYou need to resolve these duplicates first. Options:');
        console.log('1. Delete duplicate airlines');
        console.log('2. Rename duplicate airlines');
      } else {
        // Add the constraint
        await pool.query(`
          ALTER TABLE airlines ADD CONSTRAINT unique_airline_name UNIQUE (name)
        `);
        console.log('✅ Unique constraint added successfully!');
      }
    }
    
  } catch (error) {
    console.error('Error adding unique constraint:', error);
  } finally {
    await pool.end();
  }
}

addUniqueConstraint(); 