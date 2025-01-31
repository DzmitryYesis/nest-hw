import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from '../application';
import { AUTH_API_PATH } from '../../../constants';
import {
  UserConfirmationInputDto,
  UserInputDto,
  ResendConfirmationCodeInputDto,
  PasswordRecoveryInputDto,
  ChangePasswordInputDto,
  LoginInputDto,
  UserInfoViewDto,
} from '../dto';
import { ExtractUserFromRequest, BearerAuthGuard } from '../../../core';
import { UsersQueryRepository } from '../infrastructure';
import { SETTINGS } from '../../../settings';

@Controller(AUTH_API_PATH.ROOT_URL)
export class AuthController {
  constructor(
    private usersService: UsersService,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get(AUTH_API_PATH.ME)
  @UseGuards(BearerAuthGuard)
  async getUserInfo(
    @ExtractUserFromRequest() userId: string,
  ): Promise<UserInfoViewDto> {
    return this.usersQueryRepository.getUserInfoById(userId);
  }

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
  async login(
    @Body() data: LoginInputDto,
    @Res() res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.usersService.login(data);

    res.cookie(SETTINGS.REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      secure: true,
    });

    res.send({ accessToken: accessToken });
  }
}
