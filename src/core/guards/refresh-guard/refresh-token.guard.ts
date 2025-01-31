import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '../../../features/service';
import { Request } from 'express';
import { SETTINGS } from '../../../settings';
import { SessionsRepository } from '../../../features/user-accounts/infrastructure/sessions.repository';

//TODO refactoring this guard
@Injectable()
export class RefreshAuthGuard implements CanActivate {
  constructor(
    private sessionsRepository: SessionsRepository,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { userId?: string }>();
    const refreshTokenCookie = request.cookies[SETTINGS.REFRESH_TOKEN_NAME];

    if (!refreshTokenCookie) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const refreshToken = refreshTokenCookie.replace('refreshToken=', '');

    const isValidJWTFormat =
      await this.jwtService.isValidJWTFormat(refreshToken);

    if (!isValidJWTFormat) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const { deviceId, iat, userId } =
      await this.jwtService.decodeRefreshToken(refreshToken);
    const session = await this.sessionsRepository.findSessionByDeviceIdAndIat(
      deviceId,
      iat,
    );

    if (!session) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const isRefreshTokenExpired = await this.jwtService.isTokenExpired(
      refreshToken,
      SETTINGS.JWT_REFRESH_TOKEN_SECRET,
    );

    if (isRefreshTokenExpired) {
      session.deleteSession();

      await this.sessionsRepository.save(session);

      throw new UnauthorizedException('Refresh token is missing');
    }

    request.userId = userId;

    return true;
  }
}
