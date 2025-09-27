import { UsersRepository } from '../../infrastructure';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { EmailNotificationService } from '../../../service';
import { v4 as uuidV4 } from 'uuid';

export class ResendConfirmationCodeCommand {
  constructor(public email: string) {}
}

@CommandHandler(ResendConfirmationCodeCommand)
export class ResendConfirmationCodeUseCase
  implements ICommandHandler<ResendConfirmationCodeCommand>
{
  constructor(
    private usersRepository: UsersRepository,
    private emailNotificationService: EmailNotificationService,
  ) {}

  async execute(command: ResendConfirmationCodeCommand): Promise<void> {
    const user = await this.usersRepository.findUserByEmail(command.email);

    if (!user || user.isConfirmed) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'email',
            message: 'Some problem',
          },
        ],
      });
    }

    const confirmationInfo = user.emailConfirmation;

    if (
      !confirmationInfo ||
      (confirmationInfo.expirationDate &&
        new Date(confirmationInfo.expirationDate) < new Date())
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

    const confirmationCode = uuidV4();

    await this.usersRepository.updateConfirmationCode(
      confirmationCode,
      user.id,
    );

    this.emailNotificationService
      .sendEmailWithConfirmationCode({
        login: user.login,
        email: user.email,
        code: confirmationCode,
      })
      .catch((e) => console.log('Error send email: ', e));
  }
}
