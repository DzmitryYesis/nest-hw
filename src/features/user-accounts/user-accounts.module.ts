import { Module } from '@nestjs/common';
import { AuthController, UsersController } from './api';
import { UtilitiesApplicationModule } from '../service';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersSqlQueryRepository } from './infrastructure/query/users.sql-query-repository';
import { UsersService } from './application';
import { UsersRepository } from './infrastructure';
import { ConfirmUserUseCase } from './application/use-cases/confirm-user.use-case';
import { ResendConfirmationCodeUseCase } from './application/use-cases/resend-confirmation-code.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { SessionsRepository } from './infrastructure/sessions.repository';
import { SessionsQueryRepository } from './infrastructure/query/sessions.query-repository';
import { DeleteUserByIdUseCase } from './application/use-cases/delete-user-by-id.use-case';
import { PasswordRecoveryUseCase } from './application/use-cases/password-recovery.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { DeleteDeviceUseCase } from './application/use-cases/delete-device.use-case';
import { DeleteDevicesExcludeCurrentUseCase } from './application/use-cases/delete-devices-exclude-current.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { UpdateTokensUseCase } from './application/use-cases/update-tokens.use-case';
import { SecurityController } from './api/security.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailConfirmation, PasswordRecovery, User } from './domain';
import { Session } from './domain/session.entity';

//import { ThrottlerModule } from '@nestjs/throttler';

const useCases = [
  CreateUserUseCase,
  DeleteUserByIdUseCase,
  ConfirmUserUseCase,
  ResendConfirmationCodeUseCase,
  PasswordRecoveryUseCase,
  ChangePasswordUseCase,
  LoginUseCase,
  LogoutUseCase,
  UpdateTokensUseCase,
  DeleteDeviceUseCase,
  DeleteDevicesExcludeCurrentUseCase,
];

@Module({
  imports: [
    //TODO delete for e2e tests
    /*ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),*/
    TypeOrmModule.forFeature([
      User,
      EmailConfirmation,
      PasswordRecovery,
      Session,
    ]),
    UtilitiesApplicationModule,
    CqrsModule,
  ],
  controllers: [UsersController, AuthController, SecurityController],
  providers: [
    UsersService,
    UsersRepository,
    UsersSqlQueryRepository,
    SessionsRepository,
    SessionsQueryRepository,
    ...useCases,
  ],
  exports: [UsersRepository],
})
export class UserAccountsModule {}
