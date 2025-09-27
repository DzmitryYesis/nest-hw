import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { JwtService } from '../../../service';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SETTINGS } from '../../../../settings';
import { isUuidV4 } from '../../../../utils/uuidValidator';

export class DeleteDeviceCommand {
  constructor(
    public deviceId: string,
    public userId: string,
    public refreshToken: string,
  ) {}
}

@CommandHandler(DeleteDeviceCommand)
export class DeleteDeviceUseCase
  implements ICommandHandler<DeleteDeviceCommand>
{
  constructor(
    private sessionsRepository: SessionsRepository,
    private jwtService: JwtService,
  ) {}

  async execute(command: DeleteDeviceCommand): Promise<void> {
    const { userId, deviceId, refreshToken } = command;

    if (!isUuidV4(deviceId)) {
      throw new NotFoundException();
    }

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
      await this.sessionsRepository.deleteSession(session.id);

      throw new UnauthorizedException();
    }

    if (session.userId !== userId) {
      throw new ForbiddenException();
    }

    await this.sessionsRepository.deleteSession(session.id);
  }
}
