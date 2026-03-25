import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
  BeforeInsert
} from 'typeorm';
import { randomUUID } from 'crypto';
import { Album } from './Album.js';
import { Tag } from './Tag.js';
import { MediaItem } from './MediaItem.js';

@Entity('works')
export class Work {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = '';

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'varchar', length: 255 })
  title: string = '';

  @Column({ type: 'text', nullable: true })
  description: string = '';

  /**
   * @deprecated Use mediaItems instead. These fields are kept for backward compatibility
   * during migration and will be removed in a future version.
   */
  @Column({ type: 'varchar', length: 500, name: 'file_path' })
  filePath: string = '';

  /**
   * @deprecated Use mediaItems instead. These fields are kept for backward compatibility
   * during migration and will be removed in a future version.
   */
  @Column({ type: 'varchar', length: 500, nullable: true, default: null, name: 'thumbnail_small' })
  thumbnailSmall: string = '';

  /**
   * @deprecated Use mediaItems instead. These fields are kept for backward compatibility
   * during migration and will be removed in a future version.
   */
  @Column({ type: 'varchar', length: 500, nullable: true, default: null, name: 'thumbnail_large' })
  thumbnailLarge: string = '';

  /**
   * @deprecated Use mediaItems instead. These fields are kept for backward compatibility
   * during migration and will be removed in a future version.
   */
  @Column({ type: 'varchar', length: 255, name: 'original_filename' })
  originalFilename: string = '';

  /**
   * @deprecated Use mediaItems instead. These fields are kept for backward compatibility
   * during migration and will be removed in a future version.
   */
  @Column({ type: 'varchar', length: 50, name: 'file_type' })
  fileType: string = 'image';

  /**
   * @deprecated Use mediaItems instead. These fields are kept for backward compatibility
   * during migration and will be removed in a future version.
   */
  @Column({ type: 'varchar', length: 50, name: 'mime_type' })
  mimeType: string = '';

  /**
   * @deprecated Use mediaItems instead. These fields are kept for backward compatibility
   * during migration and will be removed in a future version.
   */
  @Column({ type: 'int', default: 0, name: 'file_size' })
  fileSize: number = 0;

  @Column({ type: 'int', default: 0 })
  position: number = 0;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean = false;

  @Column({ type: 'boolean', default: true })
  isPublic: boolean = true;

  @Column({ type: 'int', default: 0 })
  viewCount: number = 0;

  @Column({ type: 'int', default: 0 })
  downloadCount: number = 0;

  @OneToMany(() => MediaItem, item => item.work, { cascade: true })
  mediaItems!: MediaItem[];

  @ManyToMany(() => Album, album => album.works)
  @JoinTable({
    name: 'work_albums',
    joinColumn: { name: 'work_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'album_id', referencedColumnName: 'id' }
  })
  albums!: Album[];

  @ManyToMany(() => Tag, tag => tag.works)
  @JoinTable({
    name: 'work_tags',
    joinColumn: { name: 'work_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' }
  })
  tags!: Tag[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date = new Date();
}