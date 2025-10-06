import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { appSetup } from '../src/setup/app.setup';
import {
  authBasic,
  deleteAllData,
  ErrorMessage,
  getStringWithLength,
  invalidId,
} from './helpers';
import { QuestionTestManager } from './helpers/test-managers/question-test-manager';
import request from 'supertest';
import { QUESTION_API_PATH } from '../src/constants';
import { QuestionViewDto } from '../src/features/quiz/question/dto/view-dto/question.view-dto';

describe('Questions controller (e2e)', () => {
  let app: INestApplication;
  let questionTestManager: QuestionTestManager;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    appSetup(app);

    await app.init();

    questionTestManager = new QuestionTestManager(app);

    await deleteAllData(app);
  });

  afterEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  //GET /sa/questions
  describe('Get questions', () => {
    it('should response with error NOT_AUTH_401', async () => {
      await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic bla-bla`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with default queries data and empty Array for items', async () => {
      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should response with status BAD_REQUEST_400 and validation errors for sortBy ', async () => {
      await questionTestManager.createSeveralQuestions(5);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}?sortBy=ert`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sortBy',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should response with status BAD_REQUEST_400 and validation errors for sortDirection, pageSize and pageNumber ', async () => {
      await questionTestManager.createSeveralQuestions(5);

      const response = await request(app.getHttpServer())
        .get(
          `/${QUESTION_API_PATH}?sortBy=body&sortDirection=wer&pageSize=-2&pageNumber=dfg`,
        )
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(3);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sortDirection',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'pageSize',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'pageNumber',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should response with default queries data and 1 question', async () => {
      const question1 = await questionTestManager.createQuestion(1);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: [question1],
      });
    });

    it('should response with default queries data and 3 questions', async () => {
      const questions = await questionTestManager.createSeveralQuestions(3);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 3,
        items: questions,
      });
    });

    it('should response with default queries and 10 questions', async () => {
      const questions = await questionTestManager.createSeveralQuestions(15);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 2,
        page: 1,
        pageSize: 10,
        totalCount: 15,
        items: questions.slice(0, 10),
      });
      expect(response.body.items.length).toBe(10);
    });

    it('should response with queries pageSize=20 and 15 questions', async () => {
      const questions = await questionTestManager.createSeveralQuestions(15);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}?pageSize=20`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 20,
        totalCount: 15,
        items: questions,
      });
      expect(response.body.items.length).toBe(15);
    });

    it('should response with queries pageSize=20 sortDirection=asc and 15 questions', async () => {
      const questions = await questionTestManager.createSeveralQuestions(15);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}?pageSize=20&sortDirection=asc`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 20,
        totalCount: 15,
        items: questions.reverse(),
      });
      expect(response.body.items.length).toBe(15);
    });

    it('should response with queries pageSize=3 pageNumber=4 sortDirection=asc and 3 questions', async () => {
      const questions = await questionTestManager.createSeveralQuestions(15);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}?pageSize=3&pageNumber=4&sortDirection=asc`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 5,
        page: 4,
        pageSize: 3,
        totalCount: 15,
        items: questions.reverse().slice(9, 12),
      });
      expect(response.body.items.length).toBe(3);
    });

    it('should response with queries sortDirection=asc bodySearchTerm=2 and 2 questions', async () => {
      const questions = await questionTestManager.createSeveralQuestions(15);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}?sortDirection=asc&bodySearchTerm=2`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 2,
        items: questions
          .reverse()
          .filter((question) => question.body.includes('2')),
      });
      expect(response.body.items.length).toBe(2);
    });

    it('should response with queries sortBy=body and 10 questions', async () => {
      const questions = await questionTestManager.createSeveralQuestions(15);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}?sortBy=body`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 2,
        page: 1,
        pageSize: 10,
        totalCount: 15,
        items: questions
          .sort((a: QuestionViewDto, b: QuestionViewDto) =>
            b.body.localeCompare(a.body),
          )
          .slice(0, 10),
      });
    });

    it('should response with default queries, 2 unpublished questions and 1 published', async () => {
      const questions = await questionTestManager.createSeveralQuestions(3, 3);

      const question1 = questions[0];
      const question2 = questions[1];
      const question3 = questions[2];

      await questionTestManager.updateQuestionPublishedStatus(
        question1.id,
        true,
      );

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      const publishedQuestion1 = response.body.items.find(
        (question) => question.id === question1.id,
      );
      const publishedQuestion2 = response.body.items.find(
        (question) => question.id === question2.id,
      );
      const publishedQuestion3 = response.body.items.find(
        (question) => question.id === question3.id,
      );

      console.log('publishedQuestion: ', publishedQuestion1);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 3,
        items: questions.map((question) =>
          question.id === question1.id
            ? { ...question, published: true, updatedAt: expect.any(String) }
            : question,
        ),
      });
      expect(publishedQuestion1.published).toEqual(true);
      expect(publishedQuestion2.published).toEqual(false);
      expect(publishedQuestion3.published).toEqual(false);
    });

    it('should response with queries publishedStatus=published and 1 published question', async () => {
      const questions = await questionTestManager.createSeveralQuestions(3, 3);

      const question1 = questions[0];
      const question2 = questions[1];
      const question3 = questions[2];

      await questionTestManager.updateQuestionPublishedStatus(
        question1.id,
        true,
      );

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}?publishedStatus=published`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      const publishedQuestion1 = response.body.items.find(
        (question) => question.id === question1.id,
      );
      const publishedQuestion2 = response.body.items.find(
        (question) => question.id === question2.id,
      );
      const publishedQuestion3 = response.body.items.find(
        (question) => question.id === question3.id,
      );

      console.log('publishedQuestion: ', publishedQuestion1);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: [publishedQuestion1],
      });
      expect(publishedQuestion1.published).toEqual(true);
      expect(publishedQuestion2).toEqual(undefined);
      expect(publishedQuestion3).toEqual(undefined);
    });

    it('should response with queries publishedStatus=notPublished and 2 unpublished questions', async () => {
      const questions = await questionTestManager.createSeveralQuestions(3, 3);

      const question1 = questions[0];
      const question2 = questions[1];
      const question3 = questions[2];

      await questionTestManager.updateQuestionPublishedStatus(
        question1.id,
        true,
      );

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}?publishedStatus=notPublished`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      const publishedQuestion1 = response.body.items.find(
        (question) => question.id === question1.id,
      );
      const publishedQuestion2 = response.body.items.find(
        (question) => question.id === question2.id,
      );
      const publishedQuestion3 = response.body.items.find(
        (question) => question.id === question3.id,
      );

      console.log('publishedQuestion: ', publishedQuestion1);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 2,
        items: [publishedQuestion2, publishedQuestion3],
      });
      expect(publishedQuestion1).toEqual(undefined);
      expect(publishedQuestion2.published).toEqual(false);
      expect(publishedQuestion3.published).toEqual(false);
    });
  });

  //POST /sa/questions
  describe('Create question', () => {
    it('should return error NOT_AUTH_401 when try to create question without authorisation', async () => {
      const questionInputDto = questionTestManager.createQuestionInputDto(1);

      await request(app.getHttpServer())
        .post(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic bla-bla`)
        .send(questionInputDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with status BAD_REQUEST_400 and error for body', async () => {
      const questionInputDto = questionTestManager.createQuestionInputDto(1);

      const response = await request(app.getHttpServer())
        .post(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({
          ...questionInputDto,
          body: getStringWithLength(5),
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      response.body.errorsMessages.forEach((error: ErrorMessage) => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(typeof error.field).toBe('string');
        expect(typeof error.message).toBe('string');
      });

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for correctAnswers', async () => {
      const questionInputDto = questionTestManager.createQuestionInputDto(1);

      const response = await request(app.getHttpServer())
        .post(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({
          ...questionInputDto,
          correctAnswers: ['', '  ', '   '],
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      response.body.errorsMessages.forEach((error: ErrorMessage) => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(typeof error.field).toBe('string');
        expect(typeof error.message).toBe('string');
      });

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'correctAnswers',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for correctAnswers and body', async () => {
      const response = await request(app.getHttpServer())
        .post(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({
          correctAnswers: true,
          body: getStringWithLength(501),
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(2);

      response.body.errorsMessages.forEach((error: ErrorMessage) => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(typeof error.field).toBe('string');
        expect(typeof error.message).toBe('string');
      });

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'correctAnswers',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should created and return question without correct answers', async () => {
      const questionInputDto = questionTestManager.createQuestionInputDto(1);

      const response = await request(app.getHttpServer())
        .post(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(questionInputDto)
        .expect(HttpStatus.CREATED);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: expect.any(String),
        published: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: null,
        ...questionInputDto,
      } as QuestionViewDto);
    });

    it('should created and return question with 5 current answers', async () => {
      const questionInputDto = questionTestManager.createQuestionInputDto(1, 5);

      const response = await request(app.getHttpServer())
        .post(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(questionInputDto)
        .expect(HttpStatus.CREATED);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: expect.any(String),
        published: expect.any(Boolean),
        createdAt: expect.any(String),
        updatedAt: null,
        ...questionInputDto,
      } as QuestionViewDto);
    });
  });

  //PUT /sa/questions/:id
  describe('Update question', () => {
    it("shouldn't update question without auth", async () => {
      const question = await questionTestManager.createQuestion(1);
      const questionUpdateInputDto =
        questionTestManager.createQuestionInputDto(2);

      await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}`)
        .set('authorization', `Basic bla-bla`)
        .send(questionUpdateInputDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return BAD_REQUEST for update question with invalid questionId', async () => {
      await questionTestManager.createQuestion(1);
      const questionUpdateInputDto =
        questionTestManager.createQuestionInputDto(2);

      const response = await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${invalidId}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(questionUpdateInputDto)
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

    it("shouldn't update question with incorrect questionId", async () => {
      await questionTestManager.createQuestion(1);
      const questionUpdateInputDto =
        questionTestManager.createQuestionInputDto(2);

      const response = await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${345}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(questionUpdateInputDto)
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

    it('should return response with status BAD_REQUEST_400 and error for fields body, correctAnswers', async () => {
      const question = await questionTestManager.createQuestion(1, 2);
      const questionUpdateInputDto =
        questionTestManager.createQuestionInputDto(2);

      const response = await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ ...questionUpdateInputDto, body: '', correctAnswers: true })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(2);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'correctAnswers',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for fields correctAnswers', async () => {
      const question = await questionTestManager.createQuestion(1, 2);
      const questionUpdateInputDto =
        questionTestManager.createQuestionInputDto(2);

      const response = await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ ...questionUpdateInputDto, correctAnswers: ['', ' '] })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'correctAnswers',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for fields correctAnswers, when try to update published question and send correctAnswers=[]', async () => {
      const question = await questionTestManager.createQuestion(1, 2);
      const questionUpdateInputDto =
        questionTestManager.createQuestionInputDto(2);

      await questionTestManager.updateQuestionPublishedStatus(
        question.id,
        true,
      );

      const response = await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(questionUpdateInputDto)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'correctAnswers',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status NOT_FOUND_404', async () => {
      const question = await questionTestManager.createQuestion(1, 2);
      const questionUpdateInputDto =
        questionTestManager.createQuestionInputDto(2);

      await questionTestManager.deleteQuestion(question.id);

      await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(questionUpdateInputDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should update question', async () => {
      const question = await questionTestManager.createQuestion(1, 1);
      const questionUpdateInputDto = questionTestManager.createQuestionInputDto(
        2,
        1,
      );

      await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(questionUpdateInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body.items[0]).toStrictEqual({
        ...question,
        ...questionUpdateInputDto,
        updatedAt: expect.any(String),
      });
    });
  });

  //PUT /sa/questions/:id/publish
  describe('Update question publish status', () => {
    it("shouldn't update question publish status without auth", async () => {
      const question = await questionTestManager.createQuestion(1);

      await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}/publish`)
        .set('authorization', `Basic bla-bla`)
        .send({ published: true })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return BAD_REQUEST for update question publish status with invalid questionId', async () => {
      await questionTestManager.createQuestion(1);

      const response = await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${invalidId}/publish`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ published: true })
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

    it("shouldn't update question publish status with incorrect questionId", async () => {
      await questionTestManager.createQuestion(1);

      const response = await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${345}/publish`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ published: true })
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

    it('should return response with status BAD_REQUEST_400 and error for fields published=[]', async () => {
      const question = await questionTestManager.createQuestion(1, 2);

      const response = await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}/publish`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ published: [] })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'published',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for fields published="true"', async () => {
      const question = await questionTestManager.createQuestion(1, 2);

      const response = await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}/publish`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ published: 'true' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'published',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for fields correctAnswers, when try to update publish status for question where correctAnswers=[]', async () => {
      const question = await questionTestManager.createQuestion(1);

      const response = await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}/publish`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ published: true })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'correctAnswers',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status NOT_FOUND_404', async () => {
      const question = await questionTestManager.createQuestion(1, 2);

      await questionTestManager.deleteQuestion(question.id);

      await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}/publish`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ published: true })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should update question publish status', async () => {
      const question = await questionTestManager.createQuestion(1, 1);

      await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}/publish`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ published: true })
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body.items[0]).toStrictEqual({
        ...question,
        published: true,
        updatedAt: expect.any(String),
      });
    });

    it('should update question publish status to true and then to false', async () => {
      const question = await questionTestManager.createQuestion(1, 1);

      await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}/publish`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ published: true })
        .expect(HttpStatus.NO_CONTENT);

      const responseWithTruePublishedStatus = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(responseWithTruePublishedStatus.body);

      expect(responseWithTruePublishedStatus.body.items[0]).toStrictEqual({
        ...question,
        published: true,
        updatedAt: expect.any(String),
      });

      await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question.id}/publish`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ published: false })
        .expect(HttpStatus.NO_CONTENT);

      const responseWithFalsePublishedStatus = await request(
        app.getHttpServer(),
      )
        .get(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(responseWithFalsePublishedStatus.body);

      expect(responseWithFalsePublishedStatus.body.items[0]).toStrictEqual({
        ...question,
        published: false,
        updatedAt: expect.any(String),
      });
    });

    it('should update question publish status for question1', async () => {
      const questions = await questionTestManager.createSeveralQuestions(2, 1);

      const question1 = questions[0];
      const question2 = questions[1];

      await request(app.getHttpServer())
        .put(`/${QUESTION_API_PATH}/${question1.id}/publish`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ published: true })
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${QUESTION_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      const publishedQuestion1 = response.body.items.find(
        (question) => question.id === question1.id,
      );
      const notPublishedQuestion2 = response.body.items.find(
        (question) => question.id === question2.id,
      );

      expect(response.body.items).toHaveLength(2);
      expect(publishedQuestion1.published).toEqual(true);
      expect(notPublishedQuestion2.published).toEqual(false);
    });
  });

  //DELETE /sa/questions/:id
  describe('Delete question', () => {
    it("shouldn't delete question without auth", async () => {
      const question = await questionTestManager.createQuestion(1);

      await request(app.getHttpServer())
        .delete(`/${QUESTION_API_PATH}/${question.id}`)
        .set('authorization', `Basic bla-bla`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return BAD_REQUEST for delete question by invalid questionId', async () => {
      await questionTestManager.createQuestion(1);

      const response = await request(app.getHttpServer())
        .delete(`/${QUESTION_API_PATH}/${invalidId}`)
        .set('authorization', `Basic ${authBasic}`)
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

    it("shouldn't delete question by incorrect blogId", async () => {
      await questionTestManager.createQuestion(1);

      const response = await request(app.getHttpServer())
        .delete(`/${QUESTION_API_PATH}/${345}`)
        .set('authorization', `Basic ${authBasic}`)
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

    it('delete question by questionId', async () => {
      const question = await questionTestManager.createQuestion(1);

      await request(app.getHttpServer())
        .delete(`/${QUESTION_API_PATH}/${question.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return status NOT_FOUND for delete question by questionId', async () => {
      const question = await questionTestManager.createQuestion(1);

      await request(app.getHttpServer())
        .delete(`/${QUESTION_API_PATH}/${question.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .delete(`/${QUESTION_API_PATH}/${question.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
