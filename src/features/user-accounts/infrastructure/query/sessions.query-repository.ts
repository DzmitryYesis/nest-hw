import { SessionDeviceViewDto } from '../../dto/view-dto/session-device.view-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Session } from '../../domain/session.entity';
import { SessionStatusEnum } from '../../../../constants';

export class SessionsQueryRepository {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepo: Repository<Session>,
  ) {}

  async getAllDevices(userId: string): Promise<SessionDeviceViewDto[]> {
    const sessions = await this.sessionsRepo.find({
      where: {
        userId,
        sessionStatus: Not(SessionStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
      order: { updatedAt: 'DESC' },
    });

    return sessions.map(SessionDeviceViewDto.mapToView);
  }
}
