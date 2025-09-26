import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('email_confirmations')
export class EmailConfirmation {
  @PrimaryColumn('uuid')
  userId: string;

  @OneToOne(() => User, (u) => u.emailConfirmation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  confirmationCode: string;

  @Column({ type: 'timestamptz' })
  expirationDate: Date;

  @Column({ type: 'boolean', default: false })
  isConfirmed: boolean;
}
