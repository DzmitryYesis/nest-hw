import { CreateSessionDomainDto, LoginInputDto, LoginViewDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { CryptoService, JwtService } from '../../../service';
import { UnauthorizedException } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';

export class LoginCommand {
  constructor(
    public data: LoginInputDto,
    public ip: string,
    public device: string,
  ) {}
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(
    private usersRepository: UsersRepository,
    private sessionsRepository: SessionsRepository,
    private cryptoService: CryptoService,
    private jwtService: JwtService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginViewDto> {
    const {
      device,
      ip,
      data: { loginOrEmail, password },
    } = command;

    const [user] =
      await this.usersRepository.findUserByLoginOrEmail(loginOrEmail);

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
      password,
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

    const accessToken = await this.jwtService.createAccessJWT(user.id);
    const { refreshToken, exp, iat } = await this.jwtService.createRefreshJWT(
      deviceId,
      user.id,
    );

    const session = {
      iat,
      exp,
      deviceId,
      deviceName: device || 'Unknown device',
      ip,
      userId: user.id,
    } as CreateSessionDomainDto;

    await this.sessionsRepository.createSession(session);

    return { accessToken, refreshToken };
  }
}
