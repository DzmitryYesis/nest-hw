import { QuestionInputDto } from '../../dto/input-dto/question.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';

export class CreateQuestionCommand {
  constructor(public dto: QuestionInputDto) {}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  implements ICommandHandler<CreateQuestionCommand>
{
  constructor(private questionRepository: QuestionRepository) {}

  async execute(command: CreateQuestionCommand): Promise<string> {
    const { body, correctAnswers } = command.dto;

    return await this.questionRepository.createQuestion(body, correctAnswers);
  }
}
