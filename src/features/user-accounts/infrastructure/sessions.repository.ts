import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateSessionDomainDto, SessionRowDto } from '../dto';
import { UpdateSessionDto } from '../dto/input-dto/update-session.dto';

@Injectable()
export class SessionsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async findSessionByDeviceIdAndIat(
    deviceId: string,
    iat: number,
  ): Promise<SessionRowDto[]> {
    return await this.dataSource.query(
      `
    SELECT * FROM public."Sessions" 
    WHERE "deviceId" = $1::uuid AND "iat" = $2
    AND "sessionStatus" <> 'DELETED'
    AND "deletedAt" IS NULL`,
      [deviceId, iat],
    );
  }

  async findSessionByDeviceId(deviceId: string): Promise<SessionRowDto[]> {
    return await this.dataSource.query(
      `
    SELECT * FROM public."Sessions" 
    WHERE "deviceId" = $1::uuid 
    AND "sessionStatus" <> 'DELETED'
    AND "deletedAt" IS NULL`,
      [deviceId],
    );
  }

  async createSession(dto: CreateSessionDomainDto): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO public."Sessions" ("userId", "exp", "iat", "deviceId", "deviceName", "ip")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [dto.userId, dto.exp, dto.iat, dto.deviceId, dto.deviceName, dto.ip],
    );
  }

  async updateSession(dto: UpdateSessionDto): Promise<void> {
    await this.dataSource.query(
      `UPDATE public."Sessions" SET "iat" = $1, "exp" = $2, "updatedAt" = now()
       WHERE "id" = $3::uuid`,
      [dto.iat, dto.exp, dto.id],
    );
  }

  async deleteSession(id: string): Promise<void> {
    await this.dataSource.query(
      `
    UPDATE public."Sessions"
    SET "sessionStatus" = 'DELETED',
    "deletedAt" = now(),
    "updatedAt" = now() 
    WHERE "id" = $1::uuid
    AND "sessionStatus" <> 'DELETED'
    AND "deletedAt" IS NULL`,
      [id],
    );
  }

  async deleteSessionsExcludeCurrent(
    deviceId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `
    UPDATE public."Sessions"
    SET "sessionStatus" = 'DELETED',
    "updatedAt" = now() 
    WHERE "userId" = $1::uuid
    AND "deviceId" <> $2::uuid
    AND "sessionStatus" <> 'DELETED'
    AND "deletedAt" IS NULL
    RETURNING 1`,
      [userId, deviceId],
    );

    return result.length > 0;
  }
}
