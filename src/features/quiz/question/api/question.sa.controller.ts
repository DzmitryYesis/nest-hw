import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard, PaginatedViewDto } from '../../../../core';
import { QUESTION_API_PATH } from '../../../../constants';
import { CommandBus } from '@nestjs/cqrs';
import { QuestionInputDto } from '../dto/input-dto/question.input-dto';
import { QuestionViewDto } from '../dto/view-dto/question.view-dto';
import { QuestionQueryRepository } from '../infrastructure/query/question.query-repository';
import { CreateQuestionCommand } from '../application/use-cases/create-question.use-case';
import { UpdateQuestionCommand } from '../application/use-cases/update-question.use-case';
import { QuestionPublishedStatusInputDto } from '../dto/input-dto/question-published-status.input-dto';
import { UpdateQuestionPublishedStatusCommand } from '../application/use-cases/update-question-published-status.use-case';
import { DeleteQuestionCommand } from '../application/use-cases/delete-question.use-case';
import { QuestionsQueryParams } from '../dto/input-dto/get-questions.input-dto';

@UseGuards(BasicAuthGuard)
@Controller(QUESTION_API_PATH)
export class QuestionSAController {
  constructor(
    private questionQueryRepository: QuestionQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getQuestions(
    @Query() query: QuestionsQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    const queryParams = new QuestionsQueryParams(query);

    return this.questionQueryRepository.getQuestions(queryParams);
  }

  @Post()
  async createQuestion(
    @Body() data: QuestionInputDto,
  ): Promise<QuestionViewDto> {
    const questionId = await this.commandBus.execute(
      new CreateQuestionCommand(data),
    );

    return this.questionQueryRepository.getQuestionById(questionId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateQuestion(
    @Param('id') id: string,
    @Body() data: QuestionInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(new UpdateQuestionCommand(id, data));
  }

  @Put(':id/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateQuestionPublishedStatus(
    @Param('id') id: string,
    @Body() data: QuestionPublishedStatusInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(
      new UpdateQuestionPublishedStatusCommand(id, data),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    return await this.commandBus.execute(new DeleteQuestionCommand(id));
  }
}
