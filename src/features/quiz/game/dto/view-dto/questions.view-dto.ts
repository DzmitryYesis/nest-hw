import { GameQuestionSnapshot } from '../domain-dto/game-question.dto';

export class QuestionsViewDto {
  id: string;
  body: string;

  constructor(question: GameQuestionSnapshot) {
    this.id = question.id;
    this.body = question.body;
  }
}
