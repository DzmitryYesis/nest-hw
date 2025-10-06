import { CreateQuestionUseCase } from './question/application/use-cases/create-question.use-case';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './question/domain/question.entity';
import { QuestionSAController } from './question/api/question.sa.controller';
import { QuestionRepository } from './question/infrastructure/question.repository';
import { QuestionQueryRepository } from './question/infrastructure/query/question.query-repository';
import { CqrsModule } from '@nestjs/cqrs';
import { UpdateQuestionUseCase } from './question/application/use-cases/update-question.use-case';
import { UpdateQuestionPublishedStatusUseCase } from './question/application/use-cases/update-question-published-status.use-case';
import { DeleteQuestionUseCase } from './question/application/use-cases/delete-question.use-case';
import { Game } from './game/domain/game.entity';
import { PlayerProgress } from './game/domain/player-progress.entity';
import { Answer } from './game/domain/answer.entity';
import { GamesRepository } from './game/infrastructure/game.repository';
import { GamesQueryRepository } from './game/infrastructure/query/game.query-repository';
import { CreateGameUseCase } from './game/application/use-cases/create-game.use-case';
import { UserAccountsModule } from '../user-accounts';
import { GameController } from './game/api/game.controller';
import { GetGameByIdUseCase } from './game/application/use-cases/get-game-by-id.use-case';
import { AddAnswerUseCase } from './game/application/use-cases/add-answer.use-case';
import { AnswerRepository } from './game/infrastructure/answer.repository';
import { AnswerQueryRepository } from './game/infrastructure/query/answer.query-repository';

const useCases = [
  CreateQuestionUseCase,
  UpdateQuestionUseCase,
  UpdateQuestionPublishedStatusUseCase,
  DeleteQuestionUseCase,
  CreateGameUseCase,
  GetGameByIdUseCase,
  AddAnswerUseCase,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Game, PlayerProgress, Answer]),
    UserAccountsModule,
    CqrsModule,
  ],
  controllers: [QuestionSAController, GameController],
  providers: [
    QuestionRepository,
    QuestionQueryRepository,
    GamesRepository,
    GamesQueryRepository,
    AnswerRepository,
    AnswerQueryRepository,
    ...useCases,
  ],
})
export class QuizModule {}
