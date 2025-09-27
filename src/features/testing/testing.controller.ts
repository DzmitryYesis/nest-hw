import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { DELETE_ALL_API_PATH } from '../../constants';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Session } from '../user-accounts/domain/session.entity';
import { EmailConfirmation, PasswordRecovery, User } from '../user-accounts';

@Controller(DELETE_ALL_API_PATH.ROOT_URL)
export class TestingController {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  @Delete(DELETE_ALL_API_PATH.DELETE_ALL_DATA)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData() {
    await this.dataSource.getRepository(Session).clear();
    await this.dataSource.getRepository(EmailConfirmation).clear();
    await this.dataSource.getRepository(PasswordRecovery).clear();
    await this.dataSource.getRepository(User).clear();
    /*
    await this.dataSource.query(
      `TRUNCATE TABLE public."Blogs" RESTART IDENTITY CASCADE`,
    );
    await this.dataSource.query(
      `TRUNCATE TABLE public."Posts" RESTART IDENTITY CASCADE`,
    );
    await this.dataSource.query(
      `TRUNCATE TABLE public."PostsLikesDislikes" RESTART IDENTITY CASCADE`,
    );*/
    //await this.CommentModel.deleteMany({});
    return;
  }
}
