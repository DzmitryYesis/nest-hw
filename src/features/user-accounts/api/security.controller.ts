import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SECURITY_API_PATH } from '../../../constants';
import { SessionsService } from '../application/sessions.service';
import { RefreshAuthGuard } from '../../../core/guards/refresh-guard/refresh-token.guard';
import { Request } from 'express';
import { SETTINGS } from '../../../settings';
import { SessionDeviceViewDto } from '../dto/view-dto/session-device.view-dto';
import { SessionsQueryRepository } from '../infrastructure/query/sessions.query-repository';

@Controller(SECURITY_API_PATH.ROOT_URL)
export class SecurityController {
  constructor(
    private sessionsService: SessionsService,
    private sessionsQueryRepository: SessionsQueryRepository,
  ) {}

  @Get(SECURITY_API_PATH.DEVICES)
  @UseGuards(RefreshAuthGuard)
  async getAllDevices(
    @Req() req: Request & { userId: string },
  ): Promise<SessionDeviceViewDto[]> {
    return this.sessionsQueryRepository.getAllDevices(req.userId);
  }

  //TODO change deviceId param to Types.ObjectId
  @Delete(`${SECURITY_API_PATH.DEVICES}/:id`)
  @UseGuards(RefreshAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevice(
    @Req() req: Request & { userId: string },
    @Param('id') id: string,
  ): Promise<void> {
    return this.sessionsService.deleteDevice(
      id,
      req.userId,
      req.cookies[SETTINGS.REFRESH_TOKEN_NAME].replace('refreshToken=', ''),
    );
  }

  @Delete(SECURITY_API_PATH.DEVICES)
  @UseGuards(RefreshAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevicesExcludeCurrent(@Req() req: Request): Promise<void> {
    return this.sessionsService.deleteDevicesExcludeCurrent(
      req.cookies[SETTINGS.REFRESH_TOKEN_NAME].replace('refreshToken=', ''),
    );
  }
}
