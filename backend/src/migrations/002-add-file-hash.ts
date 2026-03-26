/**
 * Migration: Add file_hash column to media_items
 * 
 * This migration adds the file_hash column for Fast-MD5 deduplication.
 * 
 * Usage:
 *   npm run migration:file-hash
 * 
 * Or directly:
 *   npx tsx src/migrations/002-add-file-hash.ts
 */

import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Admin, Work, Album, Tag, Client, ShareAccessLog, MediaItem } from '../models/index.js';

async function main() {
  console.log('=== Add file_hash Column Migration ===\n');

  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'photo_show',
    entities: [Admin, Work, Album, Tag, Client, ShareAccessLog, MediaItem],
    synchronize: false,
    logging: true,
  });

  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Connected successfully.\n');

    // Check if column already exists
    const columnCheck = await dataSource.query(`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE table_schema = ? AND table_name = 'media_items' AND column_name = 'file_hash'
    `, [process.env.DB_NAME || 'photo_show']);

    const columnExists = columnCheck[0].count > 0;

    if (columnExists) {
      console.log('file_hash column already exists. Skipping migration.');
      return;
    }

    // Add file_hash column
    console.log('Adding file_hash column...');
    await dataSource.query(`
      ALTER TABLE media_items 
      ADD COLUMN file_hash VARCHAR(32) NULL UNIQUE
    `);
    console.log('Column added successfully.\n');

    console.log('✅ Migration completed successfully.');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

main();