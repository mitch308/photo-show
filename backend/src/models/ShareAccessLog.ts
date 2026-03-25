import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  BeforeInsert
} from 'typeorm';
import { randomUUID } from 'crypto';

/**
 * Share access log for tracking private link visits
 * Per STAT-04: 浏览和下载次数在管理后台可见
 * Per PRIV-05: 管理员可以查看私密链接的访问记录
 */
@Entity('share_access_logs')
export class ShareAccessLog {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string = '';

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'varchar', length: 64 })
  token: string = '';

  @Column({ type: 'varchar', length: 36 })
  workId: string = '';

  @Column({ type: 'varchar', length: 20 })
  action: 'view' | 'download' = 'view';

  @Column({ type: 'varchar', length: 45, nullable: true, default: null })
  ipAddress: string = '';

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  userAgent: string = '';

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date = new Date();
}