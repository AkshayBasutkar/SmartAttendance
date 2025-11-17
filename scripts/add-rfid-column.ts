#!/usr/bin/env tsx
/**
 * Script to add rfid_uid column to students table
 * 
 * Usage:
 *   tsx scripts/add-rfid-column.ts
 */

import 'dotenv/config';
import { Pool as PgPool } from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database?'
  );
}

// Detect if it's a local database or Neon serverless database
const databaseUrl = process.env.DATABASE_URL;
const isLocalDatabase = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') || databaseUrl.includes('5432');

// Configure Neon if needed
if (!isLocalDatabase) {
  neonConfig.webSocketConstructor = ws;
}

async function addRfidColumn() {
  console.log('🔧 Adding rfid_uid column to students table...\n');

  const pool = isLocalDatabase 
    ? new PgPool({ connectionString: databaseUrl })
    : new NeonPool({ connectionString: databaseUrl });

  try {
    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      AND column_name = 'rfid_uid';
    `);

    if (checkColumn.rows.length > 0) {
      console.log('ℹ️  Column rfid_uid already exists in students table.\n');
    } else {
      // Add the rfid_uid column
      await pool.query(`
        ALTER TABLE students 
        ADD COLUMN rfid_uid TEXT UNIQUE;
      `);

      console.log('✅ Successfully added rfid_uid column to students table!\n');
    }

    // Show table structure
    const columns = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'students'
      ORDER BY ordinal_position;
    `);

    console.log('📐 Updated students table structure:');
    columns.rows.forEach((col: any) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      const unique = col.column_name === 'rfid_uid' ? ' UNIQUE' : '';
      console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}${unique}`);
    });

    console.log('\n✨ Migration complete!\n');
  } catch (error) {
    console.error('❌ Error adding column:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addRfidColumn()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

