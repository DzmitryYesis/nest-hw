import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAccountsModule } from '../src/features/user-accounts';

describe('Users controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserAccountsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  /*afterEach(async () => {
    return request(app.getHttpServer())
      .delete('testing/all-data')
      .expect(HttpStatus);
  });*/

  /*it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });*/
});
