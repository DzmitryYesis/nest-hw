import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';
import { isUuidV4 } from '../../../../../utils/uuidValidator';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuestionPublishedStatusInputDto } from '../../dto/input-dto/question-published-status.input-dto';

export class UpdateQuestionPublishedStatusCommand {
  constructor(
    public id: string,
    public data: QuestionPublishedStatusInputDto,
  ) {}
}

@CommandHandler(UpdateQuestionPublishedStatusCommand)
export class UpdateQuestionPublishedStatusUseCase
  implements ICommandHandler<UpdateQuestionPublishedStatusCommand>
{
  constructor(private questionRepository: QuestionRepository) {}

  async execute(command: UpdateQuestionPublishedStatusCommand): Promise<void> {
    const { id, data } = command;

    if (!isUuidV4(id)) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'id',
            message: 'Some problem',
          },
        ],
      });
    }

    const question = await this.questionRepository.findQuestionById(id);

    if (!question) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Question with id ${id} not found`,
          },
        ],
      });
    }

    if (question.correctAnswers.length === 0) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'correctAnswers',
            message: 'Some problem',
          },
        ],
      });
    }

    return await this.questionRepository.updateQuestionPublishedStatus(
      question.id,
      data,
    );
  }
}
