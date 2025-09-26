import { EmailConfirmation } from './email-confirmation.schema';
import { UserStatusEnum } from '../../../constants';
import { PasswordRecovery } from './password-recovery.schema';
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
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

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: UserStatusEnum,
    enumName: 'user_status',
    default: UserStatusEnum.ACTIVE,
  })
  userStatus: UserStatusEnum;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  /*static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();

    user.login = dto.login;
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;

    user.emailConfirmation = {
      confirmationCode: uuidV4(),
      expirationDate: add(new Date(), {
        hours: 1,
        minutes: 3,
      }),
      isConfirmed: dto.isConfirmed,
    } as EmailConfirmation;

    user.passwordRecovery = {
      recoveryCode: null,
      expirationDate: null,
      lastUpdateDate: null,
    } as PasswordRecovery;

    return user as UserDocument;
  }*/

  /*confirmUser() {
    this.emailConfirmation.isConfirmed = true;
  }*/

  /*changeConfirmationCode() {
    this.emailConfirmation.confirmationCode = uuidV4();
    this.emailConfirmation.expirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });
  }*/

  /*createPasswordRecoveryCode() {
    this.passwordRecovery.recoveryCode = uuidV4();
    this.passwordRecovery.expirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });
  }*/

  /*changePassword(password: string) {
    this.passwordHash = password;
    this.passwordRecovery = {
      recoveryCode: null,
      expirationDate: null,
      lastUpdateDate: new Date(),
    };
  }*/

  /*deleteUser() {
    this.userStatus = UserStatusEnum.DELETED;
    this.deletedAt = new Date();
  }*/
}
