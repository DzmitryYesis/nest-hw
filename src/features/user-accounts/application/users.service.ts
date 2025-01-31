import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ChangePasswordInputDto,
  CreateUserDto,
  LoginInputDto,
  LoginViewDto,
} from '../dto';
import { v4 as uuidV4 } from 'uuid';
import { User, UserModelType } from '../domain';
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { UsersRepository } from '../infrastructure';
import {
  CryptoService,
  EmailNotificationService,
  JwtService,
} from '../../service';
import { Session, SessionModelType } from '../domain/session.entity';
import { SessionsRepository } from '../infrastructure/sessions.repository';

//TODO create auth.service
//TODO create class for 400 error
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,
    private usersRepository: UsersRepository,
    private sessionsRepository: SessionsRepository,
    private cryptoService: CryptoService,
    private emailNotificationService: EmailNotificationService,
    private jwtService: JwtService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<ObjectId> {
    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.password,
    );

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
      isConfirmed: dto.isAdmin,
    });

    if (!dto.isAdmin) {
      this.emailNotificationService
        .sendEmailWithConfirmationCode({
          login: user.login,
          email: user.email,
          code: user.emailConfirmation.confirmationCode,
        })
        .catch((e) => console.log('Error send email: ', e));
    }

    await this.usersRepository.save(user);

    return user._id;
  }

  async confirmUser(code: string): Promise<void> {
    const user = await this.usersRepository.findByCredentials(
      'emailConfirmation.confirmationCode',
      code,
    );

    if (
      !user ||
      user.emailConfirmation.confirmationCode !== code ||
      user.emailConfirmation.expirationDate < new Date() ||
      user.emailConfirmation.isConfirmed
    ) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'code',
            message: 'Some problem',
          },
        ],
      });
    }

    user.confirmUser();

    await this.usersRepository.save(user);
  }

  async resendConfirmationCode(email: string): Promise<void> {
    const user = await this.usersRepository.findByCredentials('email', email);

    if (
      !user ||
      user.emailConfirmation.expirationDate < new Date() ||
      user.emailConfirmation.isConfirmed
    ) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'email',
            message: 'Some problem',
          },
        ],
      });
    }

    user.changeConfirmationCode();

    this.emailNotificationService
      .sendEmailWithConfirmationCode({
        login: user.login,
        email: user.email,
        code: user.emailConfirmation.confirmationCode,
      })
      .catch((e) => console.log('Error send email: ', e));

    await this.usersRepository.save(user);
  }

  async passwordRecovery(email: string): Promise<void> {
    const user = await this.usersRepository.findByCredentials('email', email);

    if (user) {
      user.createPasswordRecoveryCode();

      this.emailNotificationService
        .sendEmailWithRecoveryPasswordCode({
          code: user.passwordRecovery.recoveryCode!,
          email: email,
        })
        .catch((e) => console.log('Error send email: ', e));

      await this.usersRepository.save(user);

      return;
    }

    const invalidRecoveryCode = uuidV4();

    this.emailNotificationService
      .sendEmailWithRecoveryPasswordCode({
        code: invalidRecoveryCode,
        email: email,
      })
      .catch((e) => console.log('Error send email: ', e));
  }

  async changePassword(data: ChangePasswordInputDto): Promise<void> {
    const user = await this.usersRepository.findByCredentials(
      'passwordRecovery.recoveryCode',
      data.recoveryCode,
    );

    if (!user || user.passwordRecovery.expirationDate! < new Date()) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'recoveryCode',
            message: 'Some problem',
          },
        ],
      });
    }

    const passwordHash = await this.cryptoService.createPasswordHash(
      data.newPassword,
    );

    user.changePassword(passwordHash);

    await this.usersRepository.save(user);
  }

  async login(
    data: LoginInputDto,
    ip: string,
    device: string,
  ): Promise<LoginViewDto> {
    const user = await this.usersRepository.findUserByLoginOrEmail(
      data.loginOrEmail,
    );

    if (!user) {
      throw new UnauthorizedException({
        errorsMessages: [
          {
            field: 'loginOrEmail',
            message: 'Bad login or email',
          },
        ],
      });
    }

    const isValidPassword = await this.cryptoService.comparePassword(
      data.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException({
        errorsMessages: [
          {
            field: 'password',
            message: 'Wrong password',
          },
        ],
      });
    }

    const deviceId = uuidV4();

    const accessToken = await this.jwtService.createAccessJWT(user._id);
    const { refreshToken, exp, iat } = await this.jwtService.createRefreshJWT(
      deviceId,
      user._id,
    );

    const session = this.SessionModel.createInstance({
      iat,
      exp,
      deviceId,
      deviceName: device || 'Unknown device',
      ip,
      userId: user._id.toString(),
    });

    await this.sessionsRepository.save(session);

    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string) {
    const { deviceId, iat } =
      await this.jwtService.decodeRefreshToken(refreshToken);

    const session = await this.sessionsRepository.findSessionByDeviceIdAndIat(
      deviceId,
      iat,
    );

    if (!session) {
      throw new UnauthorizedException();
    }

    session.deleteSession();

    await this.sessionsRepository.save(session);
  }

  async checkIsUserUnique(field: string, value: string): Promise<boolean> {
    const user = await this.usersRepository.findByCredentials(field, value);

    if (user) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: field,
            message: 'not unique',
          },
        ],
      });
    }

    return false;
  }

  async deleteUserById(id: ObjectId): Promise<void> {
    const user = await this.usersRepository.findByCredentials('_id', id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    user.deleteUser();

    await this.usersRepository.save(user);
  }
}
