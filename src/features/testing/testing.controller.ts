import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { DELETE_ALL_API_PATH } from '../../constants';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller(DELETE_ALL_API_PATH.ROOT_URL)
export class TestingController {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    /*@InjectModel(Comment.name)
    private CommentModel: CommentModelType,*/
  ) {}

  @Delete(DELETE_ALL_API_PATH.DELETE_ALL_DATA)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData() {
    await this.dataSource.query(
      `TRUNCATE TABLE public."Users" RESTART IDENTITY CASCADE`,
    );
    await this.dataSource.query(
      `TRUNCATE TABLE public."Sessions" RESTART IDENTITY CASCADE`,
    );
    await this.dataSource.query(
      `TRUNCATE TABLE public."EmailConfirmations" RESTART IDENTITY CASCADE`,
    );
    await this.dataSource.query(
      `TRUNCATE TABLE public."PasswordRecovery" RESTART IDENTITY CASCADE`,
    );
    await this.dataSource.query(
      `TRUNCATE TABLE public."Blogs" RESTART IDENTITY CASCADE`,
    );
    await this.dataSource.query(
      `TRUNCATE TABLE public."Posts" RESTART IDENTITY CASCADE`,
    );
    await this.dataSource.query(
      `TRUNCATE TABLE public."PostsLikesDislikes" RESTART IDENTITY CASCADE`,
    );
    //await this.CommentModel.deleteMany({});
    return;
  }
}
