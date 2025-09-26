import { SessionStatusEnum } from '../../../constants';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
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

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
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

  /*static createInstance(dto: CreateSessionDomainDto): SessionDocument {
    const session = new this();

    session.userId = dto.userId;
    session.deviceId = dto.deviceId;
    session.ip = dto.ip;
    session.deviceName = dto.deviceName;
    session.iat = dto.iat;
    session.exp = dto.exp;

    return session as SessionDocument;
  }*/

  /*updateSession(dto: UpdateSessionDto) {
    this.iat = dto.iat;
    this.exp = dto.exp;
  }*/

  /*deleteSession() {
    this.sessionStatus = SessionStatusEnum.DELETED;
    this.deletedAt = new Date();
  }*/
}
