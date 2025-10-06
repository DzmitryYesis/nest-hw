import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from '../../domain/answer.entity';
import { Repository } from 'typeorm';
import { AnswerViewDto } from '../../dto/view-dto/answer-view.dto';

@Injectable()
export class AnswerQueryRepository {
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepo: Repository<Answer>,
  ) {}

  async findAnswerById(id: string): Promise<AnswerViewDto> {
    const answer = await this.answerRepo.findOne({
      where: { id },
    });

    if (!answer) {
      throw new NotFoundException(`Answer with id ${id} not found`);
    }

    return new AnswerViewDto(answer);
  }
}
