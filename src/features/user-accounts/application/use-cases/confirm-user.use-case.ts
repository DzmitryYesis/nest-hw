import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure';
import { BadRequestException } from '@nestjs/common';

export class ConfirmUserCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmUserCommand)
export class ConfirmUserUseCase implements ICommandHandler<ConfirmUserCommand> {
  constructor(private usersRepository: UsersRepository) {}

  async execute(command: ConfirmUserCommand): Promise<void> {
    const [userInfo] =
      await this.usersRepository.findUserInfoByConfirmationCode(command.code);

    const [user] = await this.usersRepository.findUserById(userInfo.userId);

    if (
      !user ||
      !userInfo ||
      userInfo.confirmationCode !== command.code ||
      new Date(userInfo.expirationDate) < new Date() ||
      user.isConfirmed
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

    await this.usersRepository.confirmUser(user.id);
  }
}
