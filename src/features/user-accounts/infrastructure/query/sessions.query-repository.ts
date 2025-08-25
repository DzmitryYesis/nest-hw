import { SessionDeviceViewDto } from '../../dto/view-dto/session-device.view-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class SessionsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async getAllDevices(userId: string): Promise<SessionDeviceViewDto[]> {
    const devices = await this.dataSource.query(
      `
    SELECT * FROM public."Sessions" 
    WHERE "userId" = $1::uuid
    AND "sessionStatus" <> 'DELETED'
    AND "deletedAt" IS NULL`,
      [userId],
    );

    return devices.map(SessionDeviceViewDto.mapToView);
  }
}
