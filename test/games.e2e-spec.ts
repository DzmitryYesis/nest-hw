import { HttpStatus, INestApplication } from '@nestjs/common';
import { QuestionTestManager } from './helpers/test-managers/question-test-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { appSetup } from '../src/setup/app.setup';
import { delay, deleteAllData, invalidId, UserTestManager } from './helpers';
import request from 'supertest';
import { GAME_API_PATH, GameStatusEnum } from '../src/constants';
import { GameViewDto } from '../src/features/quiz/game/dto/view-dto/game.view-dto';
import { GameTestManager } from './helpers/test-managers/game-test-manager';

describe('Questions controller (e2e)', () => {
  let app: INestApplication;
  let questionTestManager: QuestionTestManager;
  let userTestManager: UserTestManager;
  let gameTestManager: GameTestManager;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    appSetup(app);

    await app.init();

    questionTestManager = new QuestionTestManager(app);
    userTestManager = new UserTestManager(app);
    gameTestManager = new GameTestManager(
      app,
      userTestManager,
      questionTestManager,
    );

    await deleteAllData(app);
  });

  afterEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  //TODO add test for 404 status for finished game
  //GET /pair-game-quiz/pairs/my-current
  describe('Get current user game', () => {
    it("shouldn't get game without auth", async () => {
      await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}`)
        .set('authorization', `Basic bla-bla`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return NOT_FOUND_404 for user without active game', async () => {
      const { accessToken } = await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should get game with status pending and firstPlayer as user', async () => {
      const { accessToken, user, game } =
        await gameTestManager.createPendingGame();

      const response = await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: game.id,
        firstPlayerProgress: {
          player: {
            id: user.id,
            login: user.login,
          },
          answers: [],
          score: 0,
        },
        secondPlayerProgress: null,
        questions: null,
        status: GameStatusEnum.PENDING_SECOND_PLAYER,
        startGameDate: null,
        pairCreatedDate: game.pairCreatedDate,
        finishGameDate: null,
      } as GameViewDto);
    });

    it('should get game with status active and firstPlayer as user1', async () => {
      const { user1, user2, game } = await gameTestManager.createActiveGame();

      const response = await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}`)
        .set('authorization', `Bearer ${user1.accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: game.id,
        firstPlayerProgress: {
          player: {
            id: user1.user.id,
            login: user1.user.login,
          },
          answers: [],
          score: 0,
        },
        secondPlayerProgress: {
          player: {
            id: user2.user.id,
            login: user2.user.login,
          },
          answers: [],
          score: 0,
        },
        questions: expect.any(Array),
        status: GameStatusEnum.ACTIVE,
        startGameDate: game.startGameDate,
        pairCreatedDate: game.pairCreatedDate,
        finishGameDate: null,
      } as GameViewDto);
    });

    it('should get game with status active and firstPlayer as user2', async () => {
      const { user1, user2, game } = await gameTestManager.createActiveGame(
        1,
        2,
        true,
      );

      const response = await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}`)
        .set('authorization', `Bearer ${user1.accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: game.id,
        firstPlayerProgress: {
          player: {
            id: user2.user.id,
            login: user2.user.login,
          },
          answers: [],
          score: 0,
        },
        secondPlayerProgress: {
          player: {
            id: user1.user.id,
            login: user1.user.login,
          },
          answers: [],
          score: 0,
        },
        questions: expect.any(Array),
        status: GameStatusEnum.ACTIVE,
        startGameDate: game.startGameDate,
        pairCreatedDate: game.pairCreatedDate,
        finishGameDate: null,
      } as GameViewDto);
    });
  });

  //TODO add test for finished game
  //GET /:id
  describe('Get game by id', () => {
    it("shouldn't get game without auth", async () => {
      const { game } = await gameTestManager.createPendingGame();

      await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/pairs/${game.id}`)
        .set('authorization', `Basic bla-bla`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return NOT_FOUND_404', async () => {
      const { user, accessToken } = await gameTestManager.createPendingGame();

      await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/pairs/${user.id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return BAD_REQUEST for request with invalid gameId', async () => {
      const { accessToken } = await gameTestManager.createPendingGame();

      const response = await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/pairs/${invalidId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it("shouldn't return game for request with incorrect gameId", async () => {
      const { accessToken } = await gameTestManager.createPendingGame();

      const response = await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/pairs/${345}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return FORBIDDEN_403 for user from another game', async () => {
      const {
        game: game1,
        user1,
        user2,
      } = await gameTestManager.createActiveGame();
      const {
        accessToken,
        user: userFromGame2,
        game: game2,
      } = await gameTestManager.createPendingGame(3);

      expect(userFromGame2.id).not.toEqual(user1.user.id);
      expect(userFromGame2.id).not.toEqual(user2.user.id);
      expect(accessToken).not.toEqual(user1.accessToken);
      expect(accessToken).not.toEqual(user2.accessToken);
      expect(game1.id).not.toEqual(game2.id);

      await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/pairs/${game1.id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should get game with status pending and firstPlayer as user', async () => {
      const { accessToken, user, game } =
        await gameTestManager.createPendingGame();

      const response = await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/pairs/${game.id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: game.id,
        firstPlayerProgress: {
          player: {
            id: user.id,
            login: user.login,
          },
          answers: [],
          score: 0,
        },
        secondPlayerProgress: null,
        questions: null,
        status: GameStatusEnum.PENDING_SECOND_PLAYER,
        startGameDate: null,
        pairCreatedDate: game.pairCreatedDate,
        finishGameDate: null,
      } as GameViewDto);
    });

    it('should get game with status active and firstPlayer as user1', async () => {
      const { user1, user2, game } = await gameTestManager.createActiveGame();

      const response = await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/pairs/${game.id}`)
        .set('authorization', `Bearer ${user1.accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: game.id,
        firstPlayerProgress: {
          player: {
            id: user1.user.id,
            login: user1.user.login,
          },
          answers: [],
          score: 0,
        },
        secondPlayerProgress: {
          player: {
            id: user2.user.id,
            login: user2.user.login,
          },
          answers: [],
          score: 0,
        },
        questions: expect.any(Array),
        status: GameStatusEnum.ACTIVE,
        startGameDate: game.startGameDate,
        pairCreatedDate: game.pairCreatedDate,
        finishGameDate: null,
      } as GameViewDto);
    });

    it('should get game with status active and firstPlayer as user2', async () => {
      const { user1, user2, game } = await gameTestManager.createActiveGame(
        1,
        2,
        true,
      );

      const response = await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/pairs/${game.id}`)
        .set('authorization', `Bearer ${user1.accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: game.id,
        firstPlayerProgress: {
          player: {
            id: user2.user.id,
            login: user2.user.login,
          },
          answers: [],
          score: 0,
        },
        secondPlayerProgress: {
          player: {
            id: user1.user.id,
            login: user1.user.login,
          },
          answers: [],
          score: 0,
        },
        questions: expect.any(Array),
        status: GameStatusEnum.ACTIVE,
        startGameDate: game.startGameDate,
        pairCreatedDate: game.pairCreatedDate,
        finishGameDate: null,
      } as GameViewDto);
    });
  });

  //POST /pair-game-quiz/pairs/connection
  describe('Create game', () => {
    it("shouldn't start game without auth", async () => {
      await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Basic bla-bla`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should start game with status game PendingSecondPlayer', async () => {
      const { accessToken, user } = await userTestManager.loggedInUser(1);

      const response = await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          player: {
            id: user.id,
            login: user.login,
          },
          answers: [],
          score: 0,
        },
        secondPlayerProgress: null,
        questions: null,
        status: GameStatusEnum.PENDING_SECOND_PLAYER,
        startGameDate: null,
        pairCreatedDate: expect.any(String),
        finishGameDate: null,
      } as GameViewDto);
    });

    it('should return FORBIDDEN_403, when user already have created game with status game PendingSecondPlayer', async () => {
      const { accessToken } = await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should start game with firstPlayerProgress as user1 and secondPlayerProgress as user2 and status game Active', async () => {
      const { accessToken: accessToken1, user: user1 } =
        await userTestManager.loggedInUser(1);
      const { accessToken: accessToken2, user: user2 } =
        await userTestManager.loggedInUser(2);

      await questionTestManager.createSeveralPublishedQuestion(5, 1);

      await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken1}`)
        .expect(HttpStatus.OK);

      await delay(50);

      const response = await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken2}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(Array.isArray(response.body.questions)).toBe(true);
      expect(response.body.questions).toHaveLength(5);
      expect(response.body).toStrictEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          player: {
            id: user1.id,
            login: user1.login,
          },
          answers: [],
          score: 0,
        },
        secondPlayerProgress: {
          player: {
            id: user2.id,
            login: user2.login,
          },
          answers: [],
          score: 0,
        },
        questions: expect.any(Array),
        status: GameStatusEnum.ACTIVE,
        startGameDate: expect.any(String),
        pairCreatedDate: expect.any(String),
        finishGameDate: null,
      } as GameViewDto);
    });

    it('should start game with firstPlayerProgress as user2 and secondPlayerProgress as user1 and status game Active', async () => {
      const { accessToken: accessToken1, user: user1 } =
        await userTestManager.loggedInUser(1);
      const { accessToken: accessToken2, user: user2 } =
        await userTestManager.loggedInUser(2);

      await questionTestManager.createSeveralPublishedQuestion(5, 1);

      await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken2}`)
        .expect(HttpStatus.OK);

      await delay(50);

      const response = await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken1}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(Array.isArray(response.body.questions)).toBe(true);
      expect(response.body.questions).toHaveLength(5);
      expect(response.body).toStrictEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          player: {
            id: user2.id,
            login: user2.login,
          },
          answers: [],
          score: 0,
        },
        secondPlayerProgress: {
          player: {
            id: user1.id,
            login: user1.login,
          },
          answers: [],
          score: 0,
        },
        questions: expect.any(Array),
        status: GameStatusEnum.ACTIVE,
        startGameDate: expect.any(String),
        pairCreatedDate: expect.any(String),
        finishGameDate: null,
      } as GameViewDto);
    });

    it('should return FORBIDDEN_403, when user1 already have game with status game Active as firstPlayer', async () => {
      const { accessToken: accessToken1, user: user1 } =
        await userTestManager.loggedInUser(1);
      const { accessToken: accessToken2, user: user2 } =
        await userTestManager.loggedInUser(2);

      await questionTestManager.createSeveralPublishedQuestion(5, 1);

      await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken1}`)
        .expect(HttpStatus.OK);

      await delay(50);

      const response = await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken2}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(Array.isArray(response.body.questions)).toBe(true);
      expect(response.body.questions).toHaveLength(5);
      expect(response.body).toStrictEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          player: {
            id: user1.id,
            login: user1.login,
          },
          answers: [],
          score: 0,
        },
        secondPlayerProgress: {
          player: {
            id: user2.id,
            login: user2.login,
          },
          answers: [],
          score: 0,
        },
        questions: expect.any(Array),
        status: GameStatusEnum.ACTIVE,
        startGameDate: expect.any(String),
        pairCreatedDate: expect.any(String),
        finishGameDate: null,
      } as GameViewDto);

      await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken1}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return FORBIDDEN_403, when user1 already have game with status game Active as SecondPlayer', async () => {
      const { accessToken: accessToken1, user: user1 } =
        await userTestManager.loggedInUser(1);
      const { accessToken: accessToken2, user: user2 } =
        await userTestManager.loggedInUser(2);

      await questionTestManager.createSeveralPublishedQuestion(5, 1);

      await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken2}`)
        .expect(HttpStatus.OK);

      await delay(50);

      const response = await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken1}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(Array.isArray(response.body.questions)).toBe(true);
      expect(response.body.questions).toHaveLength(5);
      expect(response.body).toStrictEqual({
        id: expect.any(String),
        firstPlayerProgress: {
          player: {
            id: user2.id,
            login: user2.login,
          },
          answers: [],
          score: 0,
        },
        secondPlayerProgress: {
          player: {
            id: user1.id,
            login: user1.login,
          },
          answers: [],
          score: 0,
        },
        questions: expect.any(Array),
        status: GameStatusEnum.ACTIVE,
        startGameDate: expect.any(String),
        pairCreatedDate: expect.any(String),
        finishGameDate: null,
      } as GameViewDto);

      await request(app.getHttpServer())
        .post(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.CONNECTION}`)
        .set('authorization', `Bearer ${accessToken1}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  //POST /pair-game-quiz/pairs/my-current/answer
  describe('Add answer', () => {
    it('first player answered first and have score 4:2', async () => {
      const { user1, user2, game } = await gameTestManager.createActiveGame();

      //first player send correct answer for 1 question
      const responseFirstPlayerFirstAnswerCorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user1.accessToken}`)
        .send({ answer: 'answer' })
        .expect(HttpStatus.OK);

      //first player send correct answer for 2 question
      const responseFirstPlayerSecondAnswerCorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user1.accessToken}`)
        .send({ answer: 'answer' })
        .expect(HttpStatus.OK);

      //second player send incorrect answer for 1 question
      const responseSecondPlayerFirstAnswerIncorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user2.accessToken}`)
        .send({ answer: 'answer incorrect' })
        .expect(HttpStatus.OK);

      //second player send incorrect answer for 2 question
      const responseSecondPlayerSecondAnswerIncorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user2.accessToken}`)
        .send({ answer: 'answer incorrect' })
        .expect(HttpStatus.OK);

      //first player send incorrect answer for 3 question
      const responseFirstPlayerThirdAnswerIncorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user1.accessToken}`)
        .send({ answer: 'answer incorrect' })
        .expect(HttpStatus.OK);

      //first player send correct answer for 4 question
      const responseFirstPlayerFourthAnswerCorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user1.accessToken}`)
        .send({ answer: 'answer' })
        .expect(HttpStatus.OK);

      //second player send correct answer for 3 question
      const responseSecondPlayerThirdAnswerCorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user2.accessToken}`)
        .send({ answer: 'answer' })
        .expect(HttpStatus.OK);

      //second player send correct answer for 4 question
      const responseSecondPlayerFourthAnswerCorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user2.accessToken}`)
        .send({ answer: 'answer' })
        .expect(HttpStatus.OK);

      //first player send correct answer for 5 question
      const responseFirstPlayerFifthAnswerCorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user1.accessToken}`)
        .send({ answer: 'answer' })
        .expect(HttpStatus.OK);

      const responseGame = await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}`)
        .set('authorization', `Bearer ${user1.accessToken}`)
        .expect(HttpStatus.OK);

      console.log(responseGame.body);

      expect(responseGame.body).toStrictEqual({
        id: game.id,
        firstPlayerProgress: {
          player: {
            id: user1.user.id,
            login: user1.user.login,
          },
          answers: expect.any(Array),
          score: 4,
        },
        secondPlayerProgress: {
          player: {
            id: user2.user.id,
            login: user2.user.login,
          },
          answers: expect.any(Array),
          score: 2,
        },
        questions: expect.any(Array),
        status: GameStatusEnum.ACTIVE,
        startGameDate: game.startGameDate,
        pairCreatedDate: game.pairCreatedDate,
        finishGameDate: null,
      } as GameViewDto);

      expect(responseGame.body.firstPlayerProgress.answers).toHaveLength(5);
      expect(responseGame.body.secondPlayerProgress.answers).toHaveLength(4);

      expect(responseGame.body.firstPlayerProgress.answers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ...responseFirstPlayerFirstAnswerCorrect.body,
          }),
          expect.objectContaining({
            ...responseFirstPlayerSecondAnswerCorrect.body,
          }),
          expect.objectContaining({
            ...responseFirstPlayerThirdAnswerIncorrect.body,
          }),
          expect.objectContaining({
            ...responseFirstPlayerFourthAnswerCorrect.body,
          }),
          expect.objectContaining({
            ...responseFirstPlayerFifthAnswerCorrect.body,
          }),
        ]),
      );

      expect(responseGame.body.secondPlayerProgress.answers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ...responseSecondPlayerFirstAnswerIncorrect.body,
          }),
          expect.objectContaining({
            ...responseSecondPlayerSecondAnswerIncorrect.body,
          }),
          expect.objectContaining({
            ...responseSecondPlayerThirdAnswerCorrect.body,
          }),
          expect.objectContaining({
            ...responseSecondPlayerFourthAnswerCorrect.body,
          }),
        ]),
      );
    });

    it('draw 2:2', async () => {
      const { user1, user2, game } = await gameTestManager.createActiveGame();

      //first player send correct answer for 1 question
      const responseFirstPlayerFirstAnswerCorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user1.accessToken}`)
        .send({ answer: 'answer' })
        .expect(HttpStatus.OK);

      //first player send incorrect answer for 2 question
      const responseFirstPlayerSecondAnswerIncorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user1.accessToken}`)
        .send({ answer: 'answer incorrect' })
        .expect(HttpStatus.OK);

      //second player send correct answer for 1 question
      const responseSecondPlayerFirstAnswerCorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user2.accessToken}`)
        .send({ answer: 'answer' })
        .expect(HttpStatus.OK);

      //second player send incorrect answer for 2 question
      const responseSecondPlayerSecondAnswerIncorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user2.accessToken}`)
        .send({ answer: 'answer incorrect' })
        .expect(HttpStatus.OK);

      //second player send incorrect answer for 3 question
      const responseSecondPlayerThirdAnswerIncorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user2.accessToken}`)
        .send({ answer: 'answer incorrect' })
        .expect(HttpStatus.OK);

      //second player send incorrect answer for 4 question
      const responseSecondPlayerFourthAnswerIncorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user2.accessToken}`)
        .send({ answer: 'answer incorrect' })
        .expect(HttpStatus.OK);

      //second player send incorrect answer for 5 question
      const responseSecondPlayerFifthAnswerIncorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user2.accessToken}`)
        .send({ answer: 'answer incorrect' })
        .expect(HttpStatus.OK);

      //first player send correct answer for 3 question
      const responseFirstPlayerThirdAnswerCorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user1.accessToken}`)
        .send({ answer: 'answer' })
        .expect(HttpStatus.OK);

      //first player send incorrect answer for 4 question
      const responseFirstPlayerFourthAnswerIncorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user1.accessToken}`)
        .send({ answer: 'answer incorrect' })
        .expect(HttpStatus.OK);

      //first player send incorrect answer for 5 question
      const responseFirstPlayerFifthAnswerIncorrect = await request(
        app.getHttpServer(),
      )
        .post(
          `/${GAME_API_PATH.ROOT_URL}/${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`,
        )
        .set('authorization', `Bearer ${user1.accessToken}`)
        .send({ answer: 'answer incorrect' })
        .expect(HttpStatus.OK);

      const responseGame = await request(app.getHttpServer())
        .get(`/${GAME_API_PATH.ROOT_URL}/pairs/${game.id}`)
        .set('authorization', `Bearer ${user1.accessToken}`)
        .expect(HttpStatus.OK);

      console.log(responseGame.body);

      expect(responseGame.body).toStrictEqual({
        id: game.id,
        firstPlayerProgress: {
          player: {
            id: user1.user.id,
            login: user1.user.login,
          },
          answers: expect.any(Array),
          score: 2,
        },
        secondPlayerProgress: {
          player: {
            id: user2.user.id,
            login: user2.user.login,
          },
          answers: expect.any(Array),
          score: 2,
        },
        questions: expect.any(Array),
        status: GameStatusEnum.FINISHED,
        startGameDate: game.startGameDate,
        pairCreatedDate: game.pairCreatedDate,
        finishGameDate: expect.any(String),
      } as GameViewDto);

      expect(responseGame.body.firstPlayerProgress.answers).toHaveLength(5);
      expect(responseGame.body.secondPlayerProgress.answers).toHaveLength(5);

      expect(responseGame.body.firstPlayerProgress.answers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ...responseFirstPlayerFirstAnswerCorrect.body,
          }),
          expect.objectContaining({
            ...responseFirstPlayerSecondAnswerIncorrect.body,
          }),
          expect.objectContaining({
            ...responseFirstPlayerThirdAnswerCorrect.body,
          }),
          expect.objectContaining({
            ...responseFirstPlayerFourthAnswerIncorrect.body,
          }),
          expect.objectContaining({
            ...responseFirstPlayerFifthAnswerIncorrect.body,
          }),
        ]),
      );

      expect(responseGame.body.secondPlayerProgress.answers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ...responseSecondPlayerFirstAnswerCorrect.body,
          }),
          expect.objectContaining({
            ...responseSecondPlayerSecondAnswerIncorrect.body,
          }),
          expect.objectContaining({
            ...responseSecondPlayerThirdAnswerIncorrect.body,
          }),
          expect.objectContaining({
            ...responseSecondPlayerFourthAnswerIncorrect.body,
          }),
          expect.objectContaining({
            ...responseSecondPlayerFifthAnswerIncorrect.body,
          }),
        ]),
      );
    });
  });
});
