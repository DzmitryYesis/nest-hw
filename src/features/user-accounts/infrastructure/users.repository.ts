import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { EmailConfirmation, PasswordRecovery, User } from '../domain';
import { add } from 'date-fns';
import { UserStatusEnum } from '../../../constants';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(EmailConfirmation)
    private readonly emailConfirmationRepo: Repository<EmailConfirmation>,
    @InjectRepository(PasswordRecovery)
    private readonly passwordRecoveryRepo: Repository<PasswordRecovery>,
  ) {}

  async findUserByLogin(login: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: {
        login,
        userStatus: Not(UserStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: {
        email,
        userStatus: Not(UserStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
      relations: { emailConfirmation: true },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: {
        id,
        userStatus: Not(UserStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
    });
  }

  async findUserByLoginOrEmail(data: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: [
        {
          email: data,
          userStatus: Not(UserStatusEnum.DELETED),
          deletedAt: IsNull(),
        },
        {
          login: data,
          userStatus: Not(UserStatusEnum.DELETED),
          deletedAt: IsNull(),
        },
      ],
    });
  }

  async findUserInfoByConfirmationCode(
    data: string,
  ): Promise<EmailConfirmation | null> {
    return await this.emailConfirmationRepo.findOne({
      where: { confirmationCode: data },
    });
  }

  async findUserInfoByRecoveryCode(
    data: string,
  ): Promise<PasswordRecovery | null> {
    return await this.passwordRecoveryRepo.findOne({
      where: { recoveryCode: data },
    });
  }

  async createUser(
    login: string,
    email: string,
    passwordHash: string,
    isAdmin: boolean,
    confirmationCode: string | null = null,
  ): Promise<string> {
    let user: User;

    if (!isAdmin) {
      user = this.usersRepo.create({
        login,
        email,
        passwordHash,
        emailConfirmation: {
          confirmationCode: confirmationCode as string,
          expirationDate: add(new Date(), {
            hours: 1,
            minutes: 3,
          }),
        },
      });
    } else {
      user = this.usersRepo.create({
        login,
        email,
        passwordHash,
        isConfirmed: true,
      });
    }

    await this.usersRepo.save(user);

    return user.id;
  }

  async createRecoveryCode(
    userId: string,
    recoveryCode: string,
  ): Promise<void> {
    await this.passwordRecoveryRepo.upsert(
      {
        userId,
        recoveryCode,
        expirationDate: () => `now() + interval '1 hour 3 minutes'`,
      } as any,
      { conflictPaths: ['userId'] },
    );
  }

  async confirmUser(userId: string): Promise<void> {
    await this.usersRepo.update({ id: userId }, { isConfirmed: true });
  }

  async updateConfirmationCode(
    confirmationCode: string,
    userId: string,
  ): Promise<void> {
    await this.emailConfirmationRepo.update(
      { userId },
      {
        confirmationCode,
        expirationDate: add(new Date(), {
          hours: 1,
          minutes: 3,
        }),
      },
    );
  }

  async updateUserPassword(newPassword: string, userId: string): Promise<void> {
    await this.usersRepo.update(
      { id: userId },
      {
        passwordHash: newPassword,
        passwordRecovery: { updatedAt: new Date() },
      },
    );
  }

  async deleteUser(user: User): Promise<void> {
    user.userStatus = UserStatusEnum.DELETED;
    user.deletedAt = new Date();

    await this.usersRepo.save(user);
  }
}
