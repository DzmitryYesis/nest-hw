import { AnswerInputDto } from '../../dto/input-dto/answer.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamesRepository } from '../../infrastructure/game.repository';
import { ForbiddenException } from '@nestjs/common';
import { AnswerStatusEnum } from '../../../../../constants';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export class AddAnswerCommand {
  constructor(
    public userId: string,
    public data: AnswerInputDto,
  ) {}
}

@CommandHandler(AddAnswerCommand)
export class AddAnswerUseCase implements ICommandHandler<AddAnswerCommand> {
  constructor(
    @InjectDataSource()
    protected dataSource: DataSource,
    private gamesRepository: GamesRepository,
  ) {}

  async execute({ userId, data }: AddAnswerCommand): Promise<string> {
    return this.dataSource.transaction(async (m) => {
      const game = await this.gamesRepository.findUserActiveGameForUpdate(
        userId,
        m,
      );
      if (!game) throw new ForbiddenException();

      if (game.graceDeadlineAt && new Date() > game.graceDeadlineAt) {
        await this.gamesRepository.reloadGameWithLockAndFinalizeIfNeeded(
          game.id,
          m,
        );
        throw new ForbiddenException('Time is over');
      }

      const me = game.answeringPlayerProgress(userId);
      const rival = game.rivalPlayerProgress(userId);
      if (!me || !rival || me.indexOfActiveQuestion >= 5) {
        throw new ForbiddenException();
      }

      const question = game.questions![me.indexOfActiveQuestion];
      const isCorrect = question.correctAnswers.includes(data.answer);

      const answerId = await this.gamesRepository.createAnswerTx(m, {
        userId,
        gameId: game.id,
        questionId: question.id,
        answerStatus: isCorrect
          ? AnswerStatusEnum.CORRECT
          : AnswerStatusEnum.INCORRECT,
        playerProgress: me,
      });

      const newScore = isCorrect ? me.score + 1 : me.score;
      await this.gamesRepository.updatePlayerProgressTx(m, me.id, {
        score: newScore,
        indexOfActiveQuestion: me.indexOfActiveQuestion + 1,
      });
      me.score = newScore;
      me.indexOfActiveQuestion += 1;

      if (me.indexOfActiveQuestion === 5 && rival.indexOfActiveQuestion === 5) {
        if (rival.score > 0) {
          await this.gamesRepository.updatePlayerProgressTx(m, rival.id, {
            score: rival.score + 1,
            indexOfActiveQuestion: rival.indexOfActiveQuestion,
          });
        }
        await this.gamesRepository.finishGameTx(m, game.id);
        return answerId;
      }

      if (me.indexOfActiveQuestion === 5 && rival.indexOfActiveQuestion < 5) {
        if (!game.graceDeadlineAt) {
          await this.gamesRepository.setGraceDeadlineTx(
            game.id,
            new Date(Date.now() + 10_000),
            m,
          );

          await this.gamesRepository.markFastestTx(game.id, me.id, m);
        }
        return answerId;
      }

      return answerId;
    });
  }
}
