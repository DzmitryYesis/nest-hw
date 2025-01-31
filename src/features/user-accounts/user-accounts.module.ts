import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain';
import { UsersService } from './application';
import { AuthController, UsersController } from './api';
import { UsersRepository } from './infrastructure';
import { UsersQueryRepository } from './infrastructure';
import { UtilitiesApplicationModule } from '../service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UtilitiesApplicationModule,
  ],
  controllers: [UsersController, AuthController],
  providers: [UsersService, UsersRepository, UsersQueryRepository],
  exports: [MongooseModule, UsersRepository],
})
export class UserAccountsModule {}
