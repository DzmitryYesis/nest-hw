import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
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
//import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { SessionsService } from '../application/sessions.service';
import { RefreshAuthGuard } from '../../../core/guards/refresh-guard/refresh-token.guard';

//TODO delete for e2e tests
//@UseGuards(ThrottlerGuard)
@Controller(AUTH_API_PATH.ROOT_URL)
export class AuthController {
  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get(AUTH_API_PATH.ME)
  @UseGuards(BearerAuthGuard)
  //TODO delete for e2e tests
  //@SkipThrottle()
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
    @Req() req: Request,
    @Body() data: LoginInputDto,
    @Res() res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.usersService.login(
      data,
      req.ip!,
      req.headers['user-agent']!,
    );

    res.cookie(SETTINGS.REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      secure: true,
    });

    res.send({ accessToken: accessToken });
  }

  @UseGuards(RefreshAuthGuard)
  @Post(AUTH_API_PATH.REFRESH_TOKEN)
  @HttpCode(HttpStatus.OK)
  //TODO delete for e2e tests
  //@SkipThrottle()
  async updateTokens(@Req() req: Request, @Res() res: Response): Promise<void> {
    const { accessToken, refreshToken } =
      await this.sessionsService.updateTokens(
        req.cookies[SETTINGS.REFRESH_TOKEN_NAME].replace('refreshToken=', ''),
      );

    res.cookie(SETTINGS.REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      secure: true,
    });

    res.send({ accessToken: accessToken });
  }

  @UseGuards(RefreshAuthGuard)
  @Post(AUTH_API_PATH.LOGOUT)
  @HttpCode(HttpStatus.NO_CONTENT)
  //TODO delete for e2e tests
  //@SkipThrottle()
  async logout(@Req() req: Request): Promise<void> {
    return this.usersService.logout(
      req.cookies[SETTINGS.REFRESH_TOKEN_NAME].replace('refreshToken=', ''),
    );
  }
}
