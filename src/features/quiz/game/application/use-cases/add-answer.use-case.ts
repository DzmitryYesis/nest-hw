import { AnswerInputDto } from '../../dto/input-dto/answer.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../infrastructure/game.repository';
import { ForbiddenException } from '@nestjs/common';
import { AnswerRepository } from '../../infrastructure/answer.repository';
import { AnswerStatusEnum } from '../../../../../constants';

export class AddAnswerCommand {
  constructor(
    public userId: string,
    public data: AnswerInputDto,
  ) {}
}

@CommandHandler(AddAnswerCommand)
export class AddAnswerUseCase implements ICommandHandler<AddAnswerCommand> {
  constructor(
    private gamesRepository: GamesRepository,
    private answerRepository: AnswerRepository,
  ) {}

  async execute(command: AddAnswerCommand): Promise<string> {
    const { userId, data } = command;

    const game = await this.gamesRepository.findUserActiveGame(userId);

    if (!game) {
      throw new ForbiddenException();
    }

    const answeringPlayerProgress = game.answeringPlayerProgress(userId);
    const rivalPlayerProgress = game.rivalPlayerProgress(userId);

    if (
      !answeringPlayerProgress ||
      answeringPlayerProgress.indexOfActiveQuestion >= 5
    ) {
      throw new ForbiddenException();
    }

    const answeringQuestion =
      game.questions![answeringPlayerProgress.indexOfActiveQuestion];

    const isCorrectAnswer = !!answeringQuestion.correctAnswers.find(
      (answer) => answer === data.answer,
    );

    if (isCorrectAnswer) {
      const score = answeringPlayerProgress.score + 1;

      if (
        answeringPlayerProgress.indexOfActiveQuestion === 4 &&
        rivalPlayerProgress!.indexOfActiveQuestion === 5
      ) {
        if (rivalPlayerProgress!.score > 0) {
          await this.gamesRepository.updatePlayerProgress(
            rivalPlayerProgress!.id,
            {
              score: rivalPlayerProgress!.score + 1,
              indexOfActiveQuestion: rivalPlayerProgress!.indexOfActiveQuestion,
            },
          );
        }
        await this.gamesRepository.updatePlayerProgress(
          answeringPlayerProgress.id,
          {
            score,
            indexOfActiveQuestion:
              answeringPlayerProgress.indexOfActiveQuestion + 1,
          },
        );

        await this.gamesRepository.finishGame(game.id);
      } else {
        await this.gamesRepository.updatePlayerProgress(
          answeringPlayerProgress.id,
          {
            score,
            indexOfActiveQuestion:
              answeringPlayerProgress.indexOfActiveQuestion + 1,
          },
        );
      }

      return await this.answerRepository.createAnswer({
        userId,
        gameId: game.id,
        questionId: answeringQuestion.id,
        answerStatus: AnswerStatusEnum.CORRECT,
        playerProgress: answeringPlayerProgress,
      });
    } else {
      const score = answeringPlayerProgress.score;

      await this.gamesRepository.updatePlayerProgress(
        answeringPlayerProgress.id,
        {
          score,
          indexOfActiveQuestion:
            answeringPlayerProgress.indexOfActiveQuestion + 1,
        },
      );

      if (
        answeringPlayerProgress.indexOfActiveQuestion === 4 &&
        rivalPlayerProgress!.indexOfActiveQuestion === 5
      ) {
        if (rivalPlayerProgress!.score > 0) {
          await this.gamesRepository.updatePlayerProgress(
            rivalPlayerProgress!.id,
            {
              score: rivalPlayerProgress!.score + 1,
              indexOfActiveQuestion: rivalPlayerProgress!.indexOfActiveQuestion,
            },
          );
        }

        await this.gamesRepository.finishGame(game.id);
      }

      return await this.answerRepository.createAnswer({
        userId,
        gameId: game.id,
        questionId: answeringQuestion.id,
        answerStatus: AnswerStatusEnum.INCORRECT,
        playerProgress: answeringPlayerProgress,
      });
    }
  }
}
