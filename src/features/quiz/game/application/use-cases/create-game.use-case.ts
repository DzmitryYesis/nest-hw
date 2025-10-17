import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../infrastructure/game.repository';
import { ForbiddenException } from '@nestjs/common';
import { User, UsersRepository } from '../../../../user-accounts';

export class CreateGameCommand {
  constructor(public userId: string) {}
}

@CommandHandler(CreateGameCommand)
export class CreateGameUseCase implements ICommandHandler<CreateGameCommand> {
  constructor(
    private gamesRepository: GamesRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute(command: CreateGameCommand): Promise<string> {
    const { userId } = command;

    const activeUserGame = await this.gamesRepository.findUserOpenGame(userId);

    if (activeUserGame) {
      throw new ForbiddenException("You can't create new game");
    }

    const pendingGame = await this.gamesRepository.findPendingGame();
    const user = await this.usersRepository.findUserById(userId);

    if (pendingGame) {
      return await this.gamesRepository.connectToGame(
        pendingGame,
        user as User,
      );
    } else {
      return await this.gamesRepository.createPendingGame(user as User);
    }
  }
}
