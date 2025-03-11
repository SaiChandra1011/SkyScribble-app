import { config } from 'dotenv';
import pg from 'pg';

// Load environment variables
config();

const { Pool } = pg;

// Create a new pool using the DATABASE_URL from .env or local connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Function to check unique constraints on the airlines table
async function checkUniqueConstraints() {
  const client = await pool.connect();
  
  try {
    console.log('Checking unique constraints on airlines table...');
    
    // Check for unique constraints
    const constraintQuery = `
      SELECT con.conname AS constraint_name, 
             con.contype AS constraint_type,
             obj_description(con.oid) AS constraint_description
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
      WHERE rel.relname = 'airlines'
      AND nsp.nspname = 'public'
      AND con.contype = 'u'
      ORDER BY con.conname;
    `;
    
    const { rows: constraints } = await client.query(constraintQuery);
    
    if (constraints.length > 0) {
      console.log('Found unique constraints:');
      constraints.forEach(constraint => {
        console.log(`- ${constraint.constraint_name} (type: ${constraint.constraint_type})`);
      });
    } else {
      console.log('No unique constraints found on airlines table.');
    }
    
    // Check for indexes which might enforce uniqueness
    const indexQuery = `
      SELECT i.relname AS index_name,
             a.attname AS column_name,
             ix.indisunique AS is_unique
      FROM pg_index ix
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_class t ON t.oid = ix.indrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = 'airlines'
      AND ix.indisunique = true
      ORDER BY i.relname;
    `;
    
    const { rows: indexes } = await client.query(indexQuery);
    
    if (indexes.length > 0) {
      console.log('\nFound unique indexes:');
      indexes.forEach(index => {
        console.log(`- ${index.index_name} on column: ${index.column_name} (unique: ${index.is_unique})`);
      });
    } else {
      console.log('No unique indexes found on airlines table.');
    }
    
    // Check for duplicate airlines by name
    const duplicatesQuery = `
      SELECT name, COUNT(*) 
      FROM airlines 
      GROUP BY name 
      HAVING COUNT(*) > 1;
    `;
    
    const { rows: duplicates } = await client.query(duplicatesQuery);
    
    if (duplicates.length > 0) {
      console.log('\nWARNING: Found duplicate airline names:');
      duplicates.forEach(dup => {
        console.log(`- "${dup.name}" appears ${dup.count} times`);
      });
      
      // Fetch the details of duplicates
      for (const dup of duplicates) {
        const { rows: details } = await client.query(
          'SELECT id, name, created_at FROM airlines WHERE name = $1 ORDER BY created_at',
          [dup.name]
        );
        console.log(`\nDetails for duplicates of "${dup.name}":`);
        details.forEach((airline, index) => {
          console.log(`  ${index + 1}. ID: ${airline.id}, Created: ${airline.created_at}`);
        });
      }
    } else {
      console.log('\nNo duplicate airline names found - all airline names are unique.');
    }
    
    return {
      hasConstraints: constraints.length > 0,
      hasUniqueIndexes: indexes.length > 0,
      hasDuplicates: duplicates.length > 0,
      constraints, 
      indexes,
      duplicates
    };
    
  } catch (error) {
    console.error('Error checking constraints:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the function
checkUniqueConstraints()
  .then(results => {
    console.log('\nConstraint check complete.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  }); 