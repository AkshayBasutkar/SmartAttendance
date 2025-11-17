#!/usr/bin/env tsx
/**
 * Script to create all database tables defined in the schema.
 * This script creates tables using raw SQL based on the schema definitions.
 * 
 * Usage:
 *   tsx scripts/create-tables.ts
 *   or
 *   npm run db:create-tables
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

async function createTables() {
  console.log('🚀 Starting database table creation...\n');
  console.log(`📊 Using ${isLocalDatabase ? 'local PostgreSQL' : 'Neon serverless'} database driver\n`);

  const pool = isLocalDatabase 
    ? new PgPool({ connectionString: databaseUrl })
    : new NeonPool({ connectionString: databaseUrl });

  try {
    console.log('📋 Tables to be created:');
    console.log('   - students');
    console.log('   - classes');
    console.log('   - login_logout');
    console.log('   - attendance\n');

    // Create tables using raw SQL based on the schema definitions
    await pool.query(`
      -- Create students table
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'student'
      );

      -- Create classes table
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        days TEXT[] NOT NULL
      );

      -- Create login_logout table
      CREATE TABLE IF NOT EXISTS login_logout (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        login_time TIMESTAMP WITH TIME ZONE NOT NULL,
        logout_time TIMESTAMP WITH TIME ZONE
      );

      -- Create attendance table
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT NOT NULL,
        login_logout_id INTEGER REFERENCES login_logout(id) ON DELETE SET NULL
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_login_logout_student_id ON login_logout(student_id);
      CREATE INDEX IF NOT EXISTS idx_login_logout_login_time ON login_logout(login_time);
      CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
      CREATE INDEX IF NOT EXISTS idx_attendance_login_logout_id ON attendance(login_logout_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_student_class_date ON attendance(student_id, class_id, date);
    `);

    console.log('✅ All tables and indexes created successfully!\n');

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('students', 'classes', 'login_logout', 'attendance')
      ORDER BY table_name;
    `);

    console.log('📊 Created tables:');
    result.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Show table structures
    console.log('\n📐 Table structures:');
    
    for (const tableName of ['students', 'classes', 'login_logout', 'attendance']) {
      const columns = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      console.log(`\n   ${tableName}:`);
      columns.rows.forEach((col: any) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`      - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
    }

    console.log('\n✨ Database schema setup complete!\n');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createTables()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

