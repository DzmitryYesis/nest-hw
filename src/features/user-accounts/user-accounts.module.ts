import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain';
import { UsersController } from './api';
import { UsersService } from './application';
import { UsersRepository, UsersQueryRepository } from './infrastructure';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersQueryRepository],
})
export class UserAccountsModule {}
