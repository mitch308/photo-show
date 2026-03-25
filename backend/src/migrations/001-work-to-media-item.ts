/**
 * Migration: Work to MediaItem
 * 
 * This migration migrates existing file fields from Work model to MediaItem model.
 * Each Work will have one MediaItem containing its original file data.
 * 
 * Run this migration after:
 * 1. MediaItem table is created
 * 2. Work table still has the old file fields
 * 
 * After successful migration:
 * 1. Remove file fields from Work table (separate migration)
 * 2. Update Work model to remove file fields
 */

import { DataSource } from 'typeorm';

export async function migrateWorkToMediaItem(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Get all works with their file data
    const works = await queryRunner.query(`
      SELECT 
        id, 
        file_path, 
        thumbnail_small, 
        thumbnail_large, 
        original_filename, 
        file_type, 
        mime_type, 
        file_size,
        created_at
      FROM works
      WHERE file_path IS NOT NULL AND file_path != ''
    `);

    console.log(`Found ${works.length} works to migrate`);

    // Create a MediaItem for each Work
    for (const work of works) {
      // Generate UUID for the new MediaItem
      const mediaItemId = crypto.randomUUID();
      
      await queryRunner.query(`
        INSERT INTO media_items (
          id, 
          work_id, 
          file_path, 
          thumbnail_small, 
          thumbnail_large, 
          original_filename, 
          file_type, 
          mime_type, 
          file_size, 
          position, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `, [
        mediaItemId,
        work.id,
        work.file_path,
        work.thumbnail_small,
        work.thumbnail_large,
        work.original_filename,
        work.file_type,
        work.mime_type,
        work.file_size,
        work.created_at
      ]);
    }

    await queryRunner.commitTransaction();
    console.log(`Successfully migrated ${works.length} works to media items`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

export async function rollbackMigration(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Remove all media items created by this migration
    await queryRunner.query(`DELETE FROM media_items`);

    await queryRunner.commitTransaction();
    console.log('Rollback completed: all media items removed');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  // This would need the data source to be imported and initialized
  console.log('Run this migration through the application bootstrap');
}