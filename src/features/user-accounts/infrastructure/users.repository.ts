import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  EmailConfirmationRowDto,
  PasswordRecoveryRowDto,
  UserRowDto,
} from '../dto';

@Injectable()
export class UsersRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async findUserByLogin(login: string): Promise<UserRowDto[]> {
    return await this.dataSource.query(
      `SELECT * FROM public."Users" WHERE "login" = $1 AND "userStatus" <> 'DELETED'
    AND "deletedAt" IS NULL`,
      [login],
    );
  }

  async findUserByEmail(email: string): Promise<UserRowDto[]> {
    return await this.dataSource.query(
      `SELECT * FROM public."Users" WHERE "email" = $1 AND "userStatus" <> 'DELETED'
    AND "deletedAt" IS NULL`,
      [email],
    );
  }

  async findUserById(id: string): Promise<UserRowDto[]> {
    return await this.dataSource.query(
      `SELECT * FROM public."Users" WHERE "id" = $1::uuid AND "userStatus" <> 'DELETED'
    AND "deletedAt" IS NULL`,
      [id],
    );
  }

  async findUserByLoginOrEmail(data: string): Promise<UserRowDto[]> {
    return await this.dataSource.query(
      `SELECT * FROM public."Users" WHERE ("email" = $1 OR "login" = $1) AND "userStatus" <> 'DELETED'
    AND "deletedAt" IS NULL`,
      [data],
    );
  }

  async findUserInfoByConfirmationCode(
    data: string,
  ): Promise<EmailConfirmationRowDto[]> {
    return await this.dataSource.query(
      `SELECT * FROM public."EmailConfirmations" WHERE "confirmationCode" = $1`,
      [data],
    );
  }

  async findUserConfirmationCodeById(
    id: string,
  ): Promise<EmailConfirmationRowDto[]> {
    return await this.dataSource.query(
      `SELECT * FROM public."EmailConfirmations" WHERE "userId" = $1::uuid`,
      [id],
    );
  }

  async findUserInfoByRecoveryCode(
    data: string,
  ): Promise<PasswordRecoveryRowDto[]> {
    return await this.dataSource.query(
      `SELECT * FROM public."PasswordRecovery" WHERE "recoveryCode" = $1`,
      [data],
    );
  }

  async createUser(
    login: string,
    email: string,
    passwordHash: string,
    isAdmin: boolean,
  ): Promise<string> {
    const sql = isAdmin
      ? `INSERT INTO public."Users" ("login", "email", "passwordHash", "isConfirmed")
       VALUES ($1, $2, $3, $4)
       RETURNING "id"`
      : `INSERT INTO public."Users" ("login", "email", "passwordHash")
       VALUES ($1, $2, $3)
       RETURNING "id"`;

    const params = isAdmin
      ? [login, email, passwordHash, isAdmin]
      : [login, email, passwordHash];

    const res = await this.dataSource.query(sql, params);

    return res[0].id;
  }

  async createConfirmationCode(
    confirmationCode: string,
    userId: string,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO public."EmailConfirmations" ("userId", "confirmationCode", "expirationDate")
         VALUES ($1::uuid, $2, now() + interval '1 hour 3 minutes')`,
      [userId, confirmationCode],
    );
  }

  async createRecoveryCode(
    userId: string,
    recoveryCode: string,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO public."PasswordRecovery" ("userId", "recoveryCode", "expirationDate") 
       VALUES ($1::uuid, $2, now() + interval '1 hour 3 minutes') 
       ON CONFLICT ("userId") DO 
       UPDATE SET
       "recoveryCode" = EXCLUDED."recoveryCode",
       "expirationDate" = now() + interval '1 hour 3 minutes'`,
      [userId, recoveryCode],
    );
  }

  async confirmUser(userId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE public."Users" SET "isConfirmed" = true WHERE "id" = $1::uuid`,
      [userId],
    );
  }

  async updateConfirmationCode(
    confirmationCode: string,
    userId: string,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE public."EmailConfirmations" SET "confirmationCode" = $2, "expirationDate" = now() + interval '1 hour 3 minutes' WHERE "userId" = $1::uuid`,
      [userId, confirmationCode],
    );
  }

  async updateUserPassword(newPassword: string, userId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE public."Users" SET "passwordHash" = $1, "updatedAt" = now() WHERE "id" = $2::uuid`,
      [newPassword, userId],
    );

    await this.dataSource.query(
      `UPDATE public."PasswordRecovery" SET "lastUpdateDate" = now() WHERE "userId" = $1::uuid`,
      [userId],
    );
  }

  async deleteUser(userId): Promise<void> {
    await this.dataSource.query(
      `UPDATE public."Users" SET "userStatus" = 'DELETED', "deletedAt" = now() WHERE "id" = $1::uuid`,
      [userId],
    );
  }
}
