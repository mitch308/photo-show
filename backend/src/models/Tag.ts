import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany
} from 'typeorm';
import { Work } from './Work.js';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string = '';

  @ManyToMany(() => Work, work => work.tags)
  works!: Work[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date = new Date();
}