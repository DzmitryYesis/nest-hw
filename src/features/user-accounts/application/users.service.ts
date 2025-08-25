import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure';

//TODO create class for 400 error
//TODO refactoring the same logic for checkin refresh token expire time
@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async checkIsUserHaveUniqueEmail(email: string): Promise<boolean> {
    const userByEmail = await this.usersRepository.findUserByEmail(email);

    if (userByEmail.length !== 0) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'email',
            message: 'not unique',
          },
        ],
      });
    }

    return false;
  }

  async checkIsUserHaveUniqueLogin(login: string): Promise<boolean> {
    const userByLogin = await this.usersRepository.findUserByLogin(login);

    if (userByLogin.length !== 0) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'login',
            message: 'not unique',
          },
        ],
      });
    }

    return false;
  }
}
