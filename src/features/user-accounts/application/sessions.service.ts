import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionModelType } from '../domain/session.entity';
import { SessionsRepository } from '../infrastructure/sessions.repository';
import { JwtService } from '../../service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginViewDto } from '../dto';
import { ObjectId } from 'mongodb';
import { SETTINGS } from '../../../settings';

//TODO refactoring
@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,
    private sessionsRepository: SessionsRepository,
    private jwtService: JwtService,
  ) {}

  async updateTokens(refreshToken: string): Promise<LoginViewDto> {
    const { iat: oldIat, deviceId } =
      await this.jwtService.decodeRefreshToken(refreshToken);

    const currentSession =
      await this.sessionsRepository.findSessionByDeviceIdAndIat(
        deviceId,
        oldIat,
      );

    if (!currentSession) {
      throw new UnauthorizedException();
    }

    const isRefreshTokenExpired = await this.jwtService.isTokenExpired(
      refreshToken,
      SETTINGS.JWT_REFRESH_TOKEN_SECRET,
    );

    if (isRefreshTokenExpired) {
      currentSession.deleteSession();

      await this.sessionsRepository.save(currentSession);

      throw new UnauthorizedException('Refresh token is missing');
    }

    const newAccessToken = await this.jwtService.createAccessJWT(
      new ObjectId(currentSession.userId),
    );
    const {
      refreshToken: newRefreshToken,
      iat,
      exp,
    } = await this.jwtService.createRefreshJWT(
      currentSession.deviceId,
      new ObjectId(currentSession.userId),
    );

    currentSession.updateSession({ iat, exp });

    await this.sessionsRepository.save(currentSession);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async deleteDevice(
    deviceId: string,
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const session =
      await this.sessionsRepository.findSessionByDeviceId(deviceId);

    if (!session) {
      throw new NotFoundException();
    }

    const isRefreshTokenExpired = await this.jwtService.isTokenExpired(
      refreshToken,
      SETTINGS.JWT_REFRESH_TOKEN_SECRET,
    );

    if (isRefreshTokenExpired) {
      session.deleteSession();

      await this.sessionsRepository.save(session);

      throw new UnauthorizedException();
    }

    if (session.userId !== userId) {
      throw new ForbiddenException();
    }

    session.deleteSession();

    await this.sessionsRepository.save(session);
  }

  async deleteDevicesExcludeCurrent(refreshToken: string): Promise<void> {
    const { userId, deviceId } =
      await this.jwtService.decodeRefreshToken(refreshToken);
    await this.sessionsRepository.deleteSessionsExcludeCurrent(
      deviceId,
      userId,
    );
  }
}
