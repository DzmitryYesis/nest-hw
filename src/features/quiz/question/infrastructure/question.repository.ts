import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from '../domain/question.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { QuestionStatusEnum } from '../../../../constants';
import { QuestionInputDto } from '../dto/input-dto/question.input-dto';
import { QuestionPublishedStatusInputDto } from '../dto/input-dto/question-published-status.input-dto';

@Injectable()
export class QuestionRepository {
  constructor(
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
  ) {}

  async findQuestionById(id: string): Promise<Question | null> {
    return await this.questionRepo.findOne({
      where: {
        id,
        questionStatus: Not(QuestionStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
    });
  }

  async createQuestion(
    body: string,
    correctAnswers: string[],
  ): Promise<string> {
    const question = this.questionRepo.create({
      body,
      correctAnswers,
    });

    await this.questionRepo.save(question);

    return question.id;
  }

  async updateQuestion(id: string, dto: QuestionInputDto): Promise<void> {
    const { body, correctAnswers } = dto;

    await this.questionRepo.update(
      { id },
      { body, correctAnswers, updatedAt: new Date() },
    );
  }

  async updateQuestionPublishedStatus(
    id: string,
    dto: QuestionPublishedStatusInputDto,
  ): Promise<void> {
    const { published } = dto;

    await this.questionRepo.update(
      { id },
      { published, updatedAt: new Date() },
    );
  }

  async deleteQuestion(question: Question): Promise<void> {
    question.questionStatus = QuestionStatusEnum.DELETED;
    question.deletedAt = new Date();
    question.updatedAt = new Date();

    await this.questionRepo.save(question);
  }
}
