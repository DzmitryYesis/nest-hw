import { InjectModel } from '@nestjs/mongoose';
import { Session, SessionModelType } from '../domain/session.entity';
import { SessionsRepository } from '../infrastructure/sessions.repository';
import { JwtService } from '../../service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginViewDto } from '../dto';
import { ObjectId } from 'mongodb';

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
}
