import { BaseQueryParams } from '../../../../../core';
import { QuestionsSortByEnum } from '../../../../../constants/querySortBy';
import { Optional } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { QuestionPublishedStatusEnum } from '../../../../../constants';

export class QuestionsQueryParams extends BaseQueryParams<QuestionsSortByEnum> {
  @Optional()
  @IsEnum(QuestionsSortByEnum)
  sortBy: QuestionsSortByEnum = QuestionsSortByEnum.CREATED_AT;

  @Optional()
  bodySearchTerm: string | null = null;

  @Optional()
  @IsEnum(QuestionPublishedStatusEnum)
  publishedStatus: QuestionPublishedStatusEnum =
    QuestionPublishedStatusEnum.ALL;

  constructor(query: Partial<QuestionsQueryParams> = {}) {
    super(query);
    this.sortBy = query.sortBy ?? QuestionsSortByEnum.CREATED_AT;
    this.bodySearchTerm = query.bodySearchTerm || null;
    this.publishedStatus =
      query.publishedStatus ?? QuestionPublishedStatusEnum.ALL;
  }
}
