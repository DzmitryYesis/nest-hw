import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { JwtService } from '../../../service';
import { LoginViewDto } from '../../dto';
import { UnauthorizedException } from '@nestjs/common';
import { SETTINGS } from '../../../../settings';
import { UpdateSessionDto } from '../../dto/input-dto/update-session.dto';

export class UpdateTokensCommand {
  constructor(public refreshToken: string) {}
}

//TODO refactoring expired token logic
@CommandHandler(UpdateTokensCommand)
export class UpdateTokensUseCase
  implements ICommandHandler<UpdateTokensCommand>
{
  constructor(
    private sessionsRepository: SessionsRepository,
    private jwtService: JwtService,
  ) {}

  async execute(command: UpdateTokensCommand): Promise<LoginViewDto> {
    const { iat: oldIat, deviceId } = await this.jwtService.decodeRefreshToken(
      command.refreshToken,
    );

    const [currentSession] =
      await this.sessionsRepository.findSessionByDeviceIdAndIat(
        deviceId,
        oldIat,
      );

    if (!currentSession) {
      throw new UnauthorizedException();
    }

    const isRefreshTokenExpired = await this.jwtService.isTokenExpired(
      command.refreshToken,
      SETTINGS.JWT_REFRESH_TOKEN_SECRET,
    );

    if (isRefreshTokenExpired) {
      await this.sessionsRepository.deleteSession(currentSession.id);

      throw new UnauthorizedException('Refresh token is missing');
    }

    const newAccessToken = await this.jwtService.createAccessJWT(
      currentSession.userId,
    );
    const {
      refreshToken: newRefreshToken,
      iat,
      exp,
    } = await this.jwtService.createRefreshJWT(
      currentSession.deviceId,
      currentSession.userId,
    );

    const updateInfo = {
      id: currentSession.id,
      iat,
      exp,
    } as UpdateSessionDto;

    await this.sessionsRepository.updateSession(updateInfo);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
