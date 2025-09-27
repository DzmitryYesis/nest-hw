import { ChangePasswordInputDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure';
import { CryptoService } from '../../../service';
import { BadRequestException } from '@nestjs/common';

export class ChangePasswordCommand {
  constructor(public dto: ChangePasswordInputDto) {}
}

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordUseCase
  implements ICommandHandler<ChangePasswordCommand>
{
  constructor(
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const { newPassword, recoveryCode } = command.dto;

    const recoveryPasswordInfo =
      await this.usersRepository.findUserInfoByRecoveryCode(recoveryCode);

    if (
      !recoveryPasswordInfo ||
      !recoveryPasswordInfo.expirationDate ||
      new Date(recoveryPasswordInfo.expirationDate) < new Date()
    ) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'recoveryCode',
            message: 'Some problem',
          },
        ],
      });
    }

    const passwordHash =
      await this.cryptoService.createPasswordHash(newPassword);

    await this.usersRepository.updateUserPassword(
      passwordHash,
      recoveryPasswordInfo.userId,
    );
  }
}
