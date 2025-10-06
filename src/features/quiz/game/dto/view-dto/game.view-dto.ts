import { GameStatusEnum } from '../../../../../constants';
import { Game } from '../../domain/game.entity';
import { PlayerProgressViewDto } from './player-progress.view-dto';
import { QuestionsViewDto } from './questions.view-dto';

export class GameViewDto {
  id: string;
  firstPlayerProgress: PlayerProgressViewDto;
  secondPlayerProgress: PlayerProgressViewDto | null;
  questions: QuestionsViewDto[] | null;
  status: GameStatusEnum;
  pairCreatedDate: Date;
  startGameDate: Date | null;
  finishGameDate: Date | null;

  static mapToView(game: Game): GameViewDto {
    const dto = new GameViewDto();

    dto.id = game.id;
    dto.status = game.status;
    dto.pairCreatedDate = new Date(game.createdAt);
    dto.startGameDate = game.startedAt
      ? new Date(game.startedAt)
      : game.startedAt;
    dto.finishGameDate = game.finishedAt
      ? new Date(game.finishedAt)
      : game.finishedAt;

    dto.firstPlayerProgress = PlayerProgressViewDto.mapToView(
      game.firstPlayerProgress!,
    );
    dto.secondPlayerProgress = game.secondPlayerProgress
      ? PlayerProgressViewDto.mapToView(game.secondPlayerProgress)
      : null;

    dto.questions = game.questions
      ? game.questions.map((question) => new QuestionsViewDto(question))
      : null;

    return dto;
  }
}
