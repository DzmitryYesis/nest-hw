import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts';
import { TestingController } from './testing.controller';
import { BloggersPlatformModule } from '../bloggers-platform';

@Module({
  imports: [UserAccountsModule, BloggersPlatformModule],
  controllers: [TestingController],
})
export class TestingModule {}
