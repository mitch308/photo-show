import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  BeforeInsert
} from 'typeorm';
import { randomUUID } from 'crypto';
import { Album } from './Album.js';
import { Tag } from './Tag.js';

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

  @Column({ type: 'varchar', length: 500 })
  filePath: string = '';

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  thumbnailSmall: string = '';

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  thumbnailLarge: string = '';

  @Column({ type: 'varchar', length: 255 })
  originalFilename: string = '';

  @Column({ type: 'varchar', length: 50 })
  fileType: string = 'image';

  @Column({ type: 'varchar', length: 50 })
  mimeType: string = '';

  @Column({ type: 'int', default: 0 })
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