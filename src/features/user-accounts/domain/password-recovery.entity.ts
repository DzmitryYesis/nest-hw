import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('password_recovery')
export class PasswordRecovery {
  @PrimaryColumn('uuid')
  userId: string;

  @OneToOne(() => User, (u) => u.passwordRecovery, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', nullable: true, default: null })
  recoveryCode: string | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  expirationDate: Date | null;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
