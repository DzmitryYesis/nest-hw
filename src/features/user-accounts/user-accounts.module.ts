import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain';
import { UsersService } from './application';
import { AuthController, UsersController } from './api';
import { UsersRepository } from './infrastructure';
import { UsersQueryRepository } from './infrastructure';
import { UtilitiesApplicationModule } from '../service';
import { Session, SessionSchema } from './domain/session.entity';
import { SessionsService } from './application/sessions.service';
import { SessionsRepository } from './infrastructure/sessions.repository';
import { SecurityController } from './api/security.controller';
import { SessionsQueryRepository } from './infrastructure/query/sessions.query-repository';

//import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    //TODO delete for e2e tests
    /*ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),*/
    UtilitiesApplicationModule,
  ],
  controllers: [UsersController, AuthController, SecurityController],
  providers: [
    UsersService,
    UsersRepository,
    UsersQueryRepository,
    SessionsService,
    SessionsRepository,
    SessionsQueryRepository,
  ],
  exports: [MongooseModule, UsersRepository],
})
export class UserAccountsModule {}
