import { EmailConfirmation } from './email-confirmation.entity';
import { UserStatusEnum } from '../../../constants';
import { PasswordRecovery } from './password-recovery.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Session } from './session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  login: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @OneToOne(() => EmailConfirmation, (ec) => ec.user, {
    cascade: true,
    eager: false,
  })
  emailConfirmation: EmailConfirmation;

  @OneToOne(() => PasswordRecovery, (pr) => pr.user, {
    cascade: true,
    eager: false,
  })
  passwordRecovery: PasswordRecovery;

  @OneToMany(() => Session, (s) => s.user, { cascade: false, eager: false })
  sessions: Session[];

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: UserStatusEnum,
    enumName: 'user_status',
    default: UserStatusEnum.ACTIVE,
  })
  userStatus: UserStatusEnum;

  @Column({ type: 'boolean', default: false })
  isConfirmed: boolean;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deletedAt: Date | null;
}
