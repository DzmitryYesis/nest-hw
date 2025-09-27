import { SessionStatusEnum } from '../../../constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('sessions')
@Index('idx_sessions_user', ['userId'])
@Index('idx_sessions_user_device', ['userId', 'deviceId'], { unique: true })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (u) => u.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('bigint')
  exp: string;

  @Column('bigint')
  iat: string;

  @Column({ type: 'uuid' })
  deviceId: string;

  @Column()
  deviceName: string;

  @Column({ type: 'inet' })
  ip: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: SessionStatusEnum,
    enumName: 'session_status',
    default: SessionStatusEnum.ACTIVE,
  })
  sessionStatus: SessionStatusEnum;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
