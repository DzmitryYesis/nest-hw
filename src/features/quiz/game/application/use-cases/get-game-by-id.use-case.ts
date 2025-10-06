import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../infrastructure/game.repository';
import { isUuidV4 } from '../../../../../utils/uuidValidator';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export class GetGameByIdCommand {
  constructor(
    public userId: string,
    public gameId: string,
  ) {}
}

@CommandHandler(GetGameByIdCommand)
export class GetGameByIdUseCase implements ICommandHandler<GetGameByIdCommand> {
  constructor(private gamesRepository: GamesRepository) {}

  async execute(command: GetGameByIdCommand): Promise<string> {
    const { gameId, userId } = command;

    if (!isUuidV4(gameId)) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'id',
            message: 'Some problem',
          },
        ],
      });
    }

    const game = await this.gamesRepository.findGameById(gameId);

    if (!game) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Game with id ${gameId} not found`,
          },
        ],
      });
    }

    const firstPlayer = game.firstPlayerProgress;
    const secondPlayer = game.secondPlayerProgress;

    if (
      (firstPlayer &&
        firstPlayer.playerAccount.id !== userId &&
        !secondPlayer) ||
      (firstPlayer &&
        firstPlayer.playerAccount.id !== userId &&
        secondPlayer &&
        secondPlayer.playerAccount.id !== userId)
    ) {
      throw new ForbiddenException('It is not your game');
    }

    return game.id;
  }
}
