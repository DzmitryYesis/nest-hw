import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { isUuidV4 } from '../../../../../utils/uuidValidator';
import { QuestionRepository } from '../../infrastructure/question.repository';

export class DeleteQuestionCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  implements ICommandHandler<DeleteQuestionCommand>
{
  constructor(private questionRepository: QuestionRepository) {}

  async execute(command: DeleteQuestionCommand): Promise<void> {
    if (!isUuidV4(command.id)) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'id',
            message: 'Some problem',
          },
        ],
      });
    }

    const question = await this.questionRepository.findQuestionById(command.id);

    if (!question) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Question with id ${command.id} not found`,
          },
        ],
      });
    }

    await this.questionRepository.deleteQuestion(question);
  }
}
