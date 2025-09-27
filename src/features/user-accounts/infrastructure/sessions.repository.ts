import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { CreateSessionDomainDto } from '../dto';
import { UpdateSessionDto } from '../dto/input-dto/update-session.dto';
import { Session } from '../domain/session.entity';
import { SessionStatusEnum } from '../../../constants';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepo: Repository<Session>,
  ) {}

  async findSessionByDeviceIdAndIat(
    deviceId: string,
    iat: number,
  ): Promise<Session | null> {
    return this.sessionsRepo.findOne({
      where: {
        iat: String(iat),
        deviceId,
        sessionStatus: Not(SessionStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
    });
  }

  async findSessionByDeviceId(deviceId: string): Promise<Session | null> {
    return this.sessionsRepo.findOne({
      where: {
        deviceId,
        sessionStatus: Not(SessionStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
    });
  }

  async createSession(dto: CreateSessionDomainDto): Promise<void> {
    const { userId, iat, exp, deviceId, deviceName, ip } = dto;
    const session = this.sessionsRepo.create({
      userId,
      iat: String(iat),
      exp: String(exp),
      deviceId,
      deviceName,
      ip,
    });

    await this.sessionsRepo.save(session);
  }

  async updateSession(dto: UpdateSessionDto): Promise<void> {
    const { iat, exp, id } = dto;
    await this.sessionsRepo.update(
      { id },
      {
        iat: String(iat),
        exp: String(exp),
      },
    );
  }

  async deleteSession(id: string): Promise<void> {
    await this.sessionsRepo.update(
      {
        id,
        sessionStatus: Not(SessionStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
      {
        sessionStatus: SessionStatusEnum.DELETED,
        deletedAt: () => `now()`,
      },
    );
  }

  async deleteSessionsExcludeCurrent(
    deviceId: string,
    userId: string,
  ): Promise<void> {
    await this.sessionsRepo.update(
      {
        userId,
        deviceId: Not(deviceId),
        sessionStatus: Not(SessionStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
      {
        sessionStatus: SessionStatusEnum.DELETED,
        deletedAt: () => 'now()',
      },
    );
  }
}
