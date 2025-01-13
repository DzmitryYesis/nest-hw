import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UsersService } from '../application';
import { AUTH_API_PATH } from '../../../constants';
import { UserInputDto } from '../dto';

@Controller(AUTH_API_PATH.ROOT_URL)
export class AuthController {
  constructor(private usersService: UsersService) {}

  @Post(AUTH_API_PATH.REGISTRATION)
  @HttpCode(HttpStatus.NO_CONTENT)
  async createUser(@Body() data: UserInputDto): Promise<void> {
    await this.usersService.checkIsUserUnique('login', data.login);
    await this.usersService.checkIsUserUnique('email', data.email);

    await this.usersService.createUser({ ...data, isAdmin: false });
  }
}
