import { QuestionInputDto } from '../../dto/input-dto/question.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';
import { isUuidV4 } from '../../../../../utils/uuidValidator';
import { BadRequestException, NotFoundException } from '@nestjs/common';

export class UpdateQuestionCommand {
  constructor(
    public id: string,
    public data: QuestionInputDto,
  ) {}
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(private questionRepository: QuestionRepository) {}

  async execute(command: UpdateQuestionCommand): Promise<void> {
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

    if (question.published && data.correctAnswers.length === 0) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'correctAnswers',
            message: 'Some problem',
          },
        ],
      });
    }

    return await this.questionRepository.updateQuestion(question.id, data);
  }
}
