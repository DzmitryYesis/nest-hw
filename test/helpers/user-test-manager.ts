import { HttpStatus, INestApplication } from '@nestjs/common';
import { UserInputDto, UserViewDto } from '../../src/features/user-accounts';
import request from 'supertest';
import { USERS_API_PATH } from '../../src/constants';
import { delay } from './functions';

export class UserTestManager {
  constructor(private app: INestApplication) {}

  public createUserInputDto(index: number): UserInputDto {
    return {
      login: `login_${index}`,
      password: `password_${index}`,
      email: `email${index}@gmail.com`,
    };
  }

  async createUser(
    index: number,
    statusCode = HttpStatus.CREATED,
  ): Promise<UserViewDto> {
    const userInputDto = this.createUserInputDto(index);

    const response = await request(this.app.getHttpServer())
      .post(`/${USERS_API_PATH}`)
      .send(userInputDto)
      .auth('admin', 'qwerty')
      .expect(statusCode);

    return response.body;
  }

  async createSeveralUsers(index: number): Promise<UserViewDto[]> {
    const users = [] as UserViewDto[];

    for (let i = 1; i <= index; i++) {
      await delay(50);
      const user = await this.createUser(i);
      users.unshift(user);
    }

    return users;
  }
}
