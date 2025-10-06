import { AnswerStatusEnum } from '../../../../../constants';
import { Answer } from '../../domain/answer.entity';

export class AnswerViewDto {
  questionId: string;
  answerStatus: AnswerStatusEnum;
  addedAt: Date;

  constructor(answer: Answer) {
    this.questionId = answer.questionId;
    this.answerStatus = answer.answerStatus;
    this.addedAt = new Date(answer.createdAt);
  }
}
