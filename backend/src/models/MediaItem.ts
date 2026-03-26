import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert
} from 'typeorm';
import { randomUUID } from 'crypto';
import { Work } from './Work.js';

@Entity('media_items')
export class MediaItem {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = '';

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'varchar', length: 36, name: 'work_id' })
  workId: string = '';

  @ManyToOne(() => Work, work => work.mediaItems)
  @JoinColumn({ name: 'work_id' })
  work!: Work;

  @Column({ type: 'varchar', length: 500, name: 'file_path' })
  filePath: string = '';

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'thumbnail_small', default: null })
  thumbnailSmall: string = '';

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'thumbnail_large', default: null })
  thumbnailLarge: string = '';

  @Column({ type: 'varchar', length: 255, name: 'original_filename' })
  originalFilename: string = '';

  @Column({ type: 'varchar', length: 50, name: 'file_type' })
  fileType: 'image' | 'video' = 'image';

  @Column({ type: 'varchar', length: 50, name: 'mime_type' })
  mimeType: string = '';

  @Column({ type: 'int', default: 0, name: 'file_size' })
  fileSize: number = 0;

  @Column({ type: 'int', default: 0 })
  position: number = 0;

  @Column({ type: 'varchar', length: 32, unique: true, nullable: true, name: 'file_hash', default: null })
  fileHash: string = '';

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date = new Date();
}