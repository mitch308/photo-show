/**
 * Run Migration Script
 * 
 * This script executes the Work to MediaItem migration.
 * 
 * Usage:
 *   npm run migration:run
 * 
 * Or directly:
 *   npx tsx src/migrations/run-migration.ts
 */

import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { migrateWorkToMediaItem, rollbackMigration } from './001-work-to-media-item.js';
import { Admin, Work, Album, Tag, Client, ShareAccessLog, MediaItem } from '../models/index.js';

const args = process.argv.slice(2);
const shouldRollback = args.includes('--rollback');

async function main() {
  console.log('=== Work to MediaItem Migration ===\n');
  
  // Create data source
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'photo_show',
    entities: [Admin, Work, Album, Tag, Client, ShareAccessLog, MediaItem],
    synchronize: false, // Don't auto-sync during migration
    logging: true,
  });

  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Connected successfully.\n');

    if (shouldRollback) {
      console.log('Rolling back migration...');
      await rollbackMigration(dataSource);
      console.log('\nRollback completed successfully.');
    } else {
      // Check if media_items table exists
      const tableCheck = await dataSource.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = 'media_items'
      `, [process.env.DB_NAME || 'photo_show']);

      const tableExists = tableCheck[0].count > 0;

      if (!tableExists) {
        console.log('media_items table does not exist. Creating it...');
        await dataSource.query(`
          CREATE TABLE media_items (
            id VARCHAR(36) PRIMARY KEY,
            work_id VARCHAR(36) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            thumbnail_small VARCHAR(500),
            thumbnail_large VARCHAR(500),
            original_filename VARCHAR(255) NOT NULL,
            file_type VARCHAR(50) NOT NULL,
            mime_type VARCHAR(50) NOT NULL,
            file_size INT DEFAULT 0,
            position INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
            INDEX idx_work_id (work_id),
            INDEX idx_position (position)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Table created successfully.\n');
      }

      // Run migration
      console.log('Running migration...');
      await migrateWorkToMediaItem(dataSource);
      console.log('\nMigration completed successfully.');
      
      // Verify migration
      console.log('\n=== Verification ===');
      const mediaItemCount = await dataSource.query(`SELECT COUNT(*) as count FROM media_items`);
      const worksWithFiles = await dataSource.query(`
        SELECT COUNT(*) as count FROM works WHERE file_path IS NOT NULL AND file_path != ''
      `);
      
      console.log(`Media items created: ${mediaItemCount[0].count}`);
      console.log(`Works with legacy files: ${worksWithFiles[0].count}`);
      
      if (mediaItemCount[0].count === worksWithFiles[0].count) {
        console.log('\n✅ Migration verified: All works migrated successfully.');
      } else {
        console.log('\n⚠️ Warning: Migration count mismatch. Please check manually.');
      }
    }
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