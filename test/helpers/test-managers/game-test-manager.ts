import { HttpStatus, INestApplication } from '@nestjs/common';
import { UserTestManager } from './user-test-manager';
import { QuestionTestManager } from './question-test-manager';
import request from 'supertest';
import { GAME_API_PATH } from '../../../src/constants';
import { UserViewDto } from '../../../src/features/user-accounts';
import { GameViewDto } from '../../../src/features/quiz/game/dto/view-dto/game.view-dto';
import { QuestionViewDto } from '../../../src/features/quiz/question/dto/view-dto/question.view-dto';

export class GameTestManager {
  constructor(
    private app: INestApplication,
    private userTestManager: UserTestManager,
    private questionTestManager: QuestionTestManager,
  ) {}

  async createPendingGame(
    index: number = 1,
  ): Promise<{ accessToken: string; user: UserViewDto; game: GameViewDto }> {
    const { accessToken, user } =
      await this.userTestManager.loggedInUser(index);

    const response = await request(this.app.getHttpServer())
      .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
      .set('authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK);

    return { accessToken, user, game: response.body };
  }

  async createActiveGame(
    index1: number = 1,
    index2: number = 2,
    isSecondUserFirstPlayer: boolean = false,
  ): Promise<{
    user1: { accessToken: string; user: UserViewDto };
    user2: { accessToken: string; user: UserViewDto };
    game: GameViewDto;
    questions: QuestionViewDto[];
  }> {
    const { accessToken: accessToken1, user: user1 } =
      await this.userTestManager.loggedInUser(index1);
    const { accessToken: accessToken2, user: user2 } =
      await this.userTestManager.loggedInUser(index2);

    const questions =
      await this.questionTestManager.createSeveralPublishedQuestion(5, 1);

    await request(this.app.getHttpServer())
      .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
      .set(
        'authorization',
        `Bearer ${isSecondUserFirstPlayer ? accessToken2 : accessToken1}`,
      )
      .expect(HttpStatus.OK);

    const response = await request(this.app.getHttpServer())
      .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
      .set(
        'authorization',
        `Bearer ${isSecondUserFirstPlayer ? accessToken1 : accessToken2}`,
      )
      .expect(HttpStatus.OK);

    return {
      user1: { user: user1, accessToken: accessToken1 },
      user2: { user: user2, accessToken: accessToken2 },
      game: response.body,
      questions,
    };
  }
}
