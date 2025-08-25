import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure';
import { isUuidV4 } from '../../../../utils/uuidValidator';

export class DeleteUserByIdCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteUserByIdCommand)
export class DeleteUserByIdUseCase
  implements ICommandHandler<DeleteUserByIdCommand>
{
  constructor(private usersRepository: UsersRepository) {}

  async execute(command: DeleteUserByIdCommand): Promise<void> {
    if (!isUuidV4(command.id)) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'id',
            message: 'Some problem',
          },
        ],
      });
    }

    const [user] = await this.usersRepository.findUserById(command.id);

    if (!user) {
      throw new NotFoundException(`User with id ${command.id} not found`);
    }

    await this.usersRepository.deleteUser(user.id);
  }
}
