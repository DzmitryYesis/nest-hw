import { Question } from '../../domain/question.entity';

export class QuestionViewDto {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date | null;

  static mapToView(question: Question): QuestionViewDto {
    const dto = new QuestionViewDto();

    dto.id = question.id;
    dto.body = question.body;
    dto.correctAnswers = question.correctAnswers;
    dto.published = question.published;
    dto.updatedAt = question.updatedAt
      ? new Date(question.updatedAt)
      : question.updatedAt;
    dto.createdAt = new Date(question.createdAt);

    return dto;
  }
}
