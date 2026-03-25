import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany
} from 'typeorm';
import { Work } from './Work.js';

@Entity('albums')
export class Album {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 100 })
  name: string = '';

  @Column({ type: 'text', nullable: true })
  description: string = '';

  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  coverPath: string = '';

  @Column({ type: 'int', default: 0 })
  position: number = 0;

  @ManyToMany(() => Work, work => work.albums)
  works!: Work[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date = new Date();
}