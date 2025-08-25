import { UsersRepository } from '../../infrastructure';
import { CryptoService, EmailNotificationService } from '../../../service';
import { CreateUserDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersService } from '../users.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';

export class CreateUserCommand {
  constructor(public dto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    private userRepository: UsersRepository,
    private usersService: UsersService,
    private cryptoService: CryptoService,
    private emailNotificationService: EmailNotificationService,
  ) {}

  async execute(command: CreateUserCommand): Promise<string> {
    const { isAdmin, email, login, password } = command.dto;

    await this.usersService.checkIsUserHaveUniqueLogin(login);
    await this.usersService.checkIsUserHaveUniqueEmail(email);

    const passwordHash = await this.cryptoService.createPasswordHash(password);

    if (!isAdmin) {
      const confirmationCode = uuidV4();

      const userId = await this.userRepository.createUser(
        login,
        email,
        passwordHash,
        false,
      );

      await this.userRepository.createConfirmationCode(
        confirmationCode,
        userId,
      );

      this.emailNotificationService
        .sendEmailWithConfirmationCode({
          login: login,
          email: email,
          code: confirmationCode,
        })
        .catch((e) => console.log('Error send email: ', e));

      return userId;
    }

    return await this.userRepository.createUser(
      login,
      email,
      passwordHash,
      true,
    );
  }
}
