import { HttpStatus, INestApplication } from '@nestjs/common';
import { QuestionInputDto } from '../../../src/features/quiz/question/dto/input-dto/question.input-dto';
import { QuestionViewDto } from '../../../src/features/quiz/question/dto/view-dto/question.view-dto';
import request from 'supertest';
import { QUESTION_API_PATH } from '../../../src/constants';
import { delay } from '../functions';

export class QuestionTestManager {
  constructor(private app: INestApplication) {}

  public createQuestionInputDto(
    index: number,
    numbersOfAnswer: number = 0,
  ): QuestionInputDto {
    return {
      body: `question body ${index}`,
      correctAnswers: !numbersOfAnswer
        ? []
        : Array.from({ length: numbersOfAnswer }, () => 'answer'),
    };
  }

  async createQuestion(
    index: number,
    numbersOfAnswer: number = 0,
  ): Promise<QuestionViewDto> {
    const questionInputDto = this.createQuestionInputDto(
      index,
      numbersOfAnswer,
    );

    const response = await request(this.app.getHttpServer())
      .post(`/${QUESTION_API_PATH}`)
      .send(questionInputDto)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.CREATED);

    return response.body;
  }

  async createSeveralQuestions(
    index: number,
    numbersOfAnswer: number = 0,
  ): Promise<QuestionViewDto[]> {
    const questions = [] as QuestionViewDto[];
    for (let i = 1; i <= index; i++) {
      await delay(50);
      const question = await this.createQuestion(i, numbersOfAnswer);
      questions.unshift(question);
    }

    return questions;
  }

  async updateQuestionPublishedStatus(
    id: string,
    status: boolean,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/${QUESTION_API_PATH}/${id}/publish`)
      .send({ published: status })
      .auth('admin', 'qwerty')
      .expect(HttpStatus.NO_CONTENT);
  }

  async createSeveralPublishedQuestion(
    index: number,
    numbersOfAnswer: number = 0,
  ): Promise<QuestionViewDto[]> {
    const questions = [] as QuestionViewDto[];
    for (let i = 1; i <= index; i++) {
      await delay(50);
      const question = await this.createQuestion(i, numbersOfAnswer);
      await delay(50);
      await this.updateQuestionPublishedStatus(question.id, true);
      questions.unshift(question);
    }

    return questions;
  }

  async deleteQuestion(id: string): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/${QUESTION_API_PATH}/${id}`)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.NO_CONTENT);
  }
}
