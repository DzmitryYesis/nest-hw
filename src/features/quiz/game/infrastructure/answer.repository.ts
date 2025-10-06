import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from '../domain/answer.entity';
import { Repository } from 'typeorm';
import { CreateAnswerDto } from '../dto/domain-dto/create-answer.dto';

@Injectable()
export class AnswerRepository {
  constructor(
    @InjectRepository(Answer)
    private answerRepo: Repository<Answer>,
  ) {}

  async createAnswer(dto: CreateAnswerDto): Promise<string> {
    const answer = this.answerRepo.create({
      userId: dto.userId,
      gameId: dto.gameId,
      questionId: dto.questionId,
      answerStatus: dto.answerStatus,
      playerProgress: dto.playerProgress,
    });

    await this.answerRepo.save(answer);

    return answer.id;
  }
}
