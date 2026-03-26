import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  BeforeInsert
} from 'typeorm';
import { randomUUID } from 'crypto';

/**
 * System-wide settings storage using key-value pattern.
 * Each setting type (e.g., 'watermark') has a single row.
 */
@Entity('system_settings')
export class SystemSettings {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = '';

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'varchar', length: 50, unique: true })
  key: string = '';

  @Column({ type: 'json' })
  value: Record<string, unknown> = {};

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date = new Date();
}