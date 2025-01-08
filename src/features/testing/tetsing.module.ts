import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts';
import { TestingController } from './testing.controller';

@Module({
  imports: [UserAccountsModule],
  controllers: [TestingController],
})
export class TestingModule {}
