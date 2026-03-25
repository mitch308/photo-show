import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany
} from 'typeorm';
import { randomUUID } from 'crypto';

@Entity('clients')
export class Client {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = '';

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'varchar', length: 100 })
  name: string = '';

  @Column({ type: 'varchar', length: 50, nullable: true, default: null })
  phone: string = '';

  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  email: string = '';

  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  company: string = '';

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  address: string = '';

  @Column({ type: 'date', nullable: true, default: null })
  birthday: Date | null = null;

  @Column({ type: 'text', nullable: true, default: null })
  notes: string = '';

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date = new Date();
}