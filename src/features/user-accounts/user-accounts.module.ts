import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain';
import { UsersService } from './application';
import { UsersController } from './api';
import { UsersRepository } from './infrastructure';
import { UsersQueryRepository } from './infrastructure';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersQueryRepository],
  exports: [MongooseModule],
})
export class UserAccountsModule {}
