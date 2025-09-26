import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
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

  @Column({ type: 'timestamptz', nullable: true, default: null })
  lastUpdateDate: Date | null;
}
