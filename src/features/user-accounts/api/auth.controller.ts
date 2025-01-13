import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UsersService } from '../application';
import { AUTH_API_PATH } from '../../../constants';
import {
  UserConfirmationInputDto,
  UserInputDto,
  ResendConfirmationCodeInputDto,
  PasswordRecoveryInputDto,
  ChangePasswordInputDto,
  LoginInputDto,
  LoginViewDto,
} from '../dto';

@Controller(AUTH_API_PATH.ROOT_URL)
export class AuthController {
  constructor(private usersService: UsersService) {}

  @Post(AUTH_API_PATH.REGISTRATION)
  @HttpCode(HttpStatus.NO_CONTENT)
  async registeredUser(@Body() data: UserInputDto): Promise<void> {
    await this.usersService.checkIsUserUnique('login', data.login);
    await this.usersService.checkIsUserUnique('email', data.email);

    await this.usersService.createUser({ ...data, isAdmin: false });
  }

  @Post(AUTH_API_PATH.REGISTRATION_CONFIRMATION)
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmUserRegistration(
    @Body() data: UserConfirmationInputDto,
  ): Promise<void> {
    return this.usersService.confirmUser(data.code);
  }

  @Post(AUTH_API_PATH.REGISTRATION_EMAIL_RESENDING)
  @HttpCode(HttpStatus.NO_CONTENT)
  async resendConfirmationCode(
    @Body() data: ResendConfirmationCodeInputDto,
  ): Promise<void> {
    return this.usersService.resendConfirmationCode(data.email);
  }

  @Post(AUTH_API_PATH.PASSWORD_RECOVERY)
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(
    @Body() data: PasswordRecoveryInputDto,
  ): Promise<void> {
    return this.usersService.passwordRecovery(data.email);
  }

  @Post(AUTH_API_PATH.NEW_PASSWORD)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Body() data: ChangePasswordInputDto): Promise<void> {
    return this.usersService.changePassword(data);
  }

  @Post(AUTH_API_PATH.LOGIN)
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: LoginInputDto): Promise<LoginViewDto> {
    return this.usersService.login(data);
  }
}
