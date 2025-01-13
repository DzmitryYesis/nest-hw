import { Module } from '@nestjs/common';
import { CryptoService, EmailNotificationService } from './application';

@Module({
  providers: [CryptoService, EmailNotificationService],
  exports: [CryptoService, EmailNotificationService],
})
export class UtilitiesApplicationModule {}
