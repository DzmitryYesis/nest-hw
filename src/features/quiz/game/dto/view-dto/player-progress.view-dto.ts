import { PlayerProgress } from '../../domain/player-progress.entity';
import { PlayerViewDto } from './player.view-dto';
import { AnswerViewDto } from './answer-view.dto';

export class PlayerProgressViewDto {
  player: PlayerViewDto;
  score: number;
  answers: AnswerViewDto[];

  static mapToView(playerProgress: PlayerProgress): PlayerProgressViewDto {
    const dto = new PlayerProgressViewDto();

    dto.player = new PlayerViewDto(playerProgress.playerAccount);
    dto.score = playerProgress.score;
    const answers = playerProgress.answers ?? [];

    const sorted = [...answers].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    dto.answers = sorted.map((answer) => new AnswerViewDto(answer));

    return dto;
  }
}
