import { AnswerStatusEnum } from '../../../../../constants';
import { PlayerProgress } from '../../domain/player-progress.entity';

export class CreateAnswerDto {
  userId: string;
  gameId: string;
  questionId: string;
  answerStatus: AnswerStatusEnum;
  playerProgress: PlayerProgress;
}
