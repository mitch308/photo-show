import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', unique: true, length: 50 })
  username: string = '';

  @Column({ type: 'varchar', length: 255 })
  password: string = '';

  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  email: string = '';

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date = new Date();
}