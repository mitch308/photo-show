import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  BeforeInsert
} from 'typeorm';
import { randomUUID } from 'crypto';
import { Work } from './Work.js';

@Entity('tags')
export class Tag {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = '';

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string = '';

  @ManyToMany(() => Work, work => work.tags)
  works!: Work[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date = new Date();
}