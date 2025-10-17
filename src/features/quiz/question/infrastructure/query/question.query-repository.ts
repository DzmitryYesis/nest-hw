import { Injectable, NotFoundException } from '@nestjs/common';
import { IsNull, Not, Repository } from 'typeorm';
import { Question } from '../../domain/question.entity';
import { QuestionViewDto } from '../../dto/view-dto/question.view-dto';
import {
  QuestionPublishedStatusEnum,
  QuestionStatusEnum,
} from '../../../../../constants';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionsQueryParams } from '../../dto/input-dto/get-questions.input-dto';
import { PaginatedViewDto } from '../../../../../core';

@Injectable()
export class QuestionQueryRepository {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
  ) {}

  async getQuestions(
    query: QuestionsQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    const {
      bodySearchTerm,
      publishedStatus,
      sortBy,
      sortDirection,
      pageNumber,
      pageSize,
    } = query;

    const qb = this.questionRepo
      .createQueryBuilder('q')
      .where('q.questionStatus <> :deleted', {
        deleted: QuestionStatusEnum.DELETED,
      })
      .andWhere('q.deletedAt IS NULL');

    if (bodySearchTerm) {
      qb.andWhere('q.body ILIKE :body', { body: `%${bodySearchTerm}%` });
    }

    if (publishedStatus === QuestionPublishedStatusEnum.PUBLISHED) {
      qb.andWhere('q.published = :published', {
        published: true,
      });
    }

    if (publishedStatus === QuestionPublishedStatusEnum.NOT_PUBLISHED) {
      qb.andWhere('q.published = :published', {
        published: false,
      });
    }

    const dir: 'ASC' | 'DESC' =
      String(sortDirection).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sortMap: Record<string, string> = {
      body: `"q"."body" COLLATE "C"`,
      createdAt: 'q.createdAt',
    };

    qb.orderBy(sortMap[sortBy] ?? 'q.createdAt', dir);
    qb.skip((pageNumber - 1) * pageSize).take(pageSize);

    const [items, totalCount] = await qb.getManyAndCount();

    const viewItems = items.map(QuestionViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items: viewItems,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getQuestionById(id: string): Promise<QuestionViewDto> {
    const question = await this.questionRepo.findOne({
      where: {
        id,
        questionStatus: Not(QuestionStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with id ${id} not found`);
    }

    return QuestionViewDto.mapToView(question);
  }
}
