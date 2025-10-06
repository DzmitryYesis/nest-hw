import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { DELETE_ALL_API_PATH } from '../../constants';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller(DELETE_ALL_API_PATH.ROOT_URL)
export class TestingController {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  @Delete(DELETE_ALL_API_PATH.DELETE_ALL_DATA)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData() {
    await this.dataSource.query(`
  TRUNCATE TABLE
    "sessions",
    "email_confirmations",
    "password_recovery",
    "users",
    "comment_likes",
    "comments",
    "post_likes",
    "posts",
    "blogs",
    "questions",
    "games",
    "player_progress",
    "answers"
  RESTART IDENTITY CASCADE
`);
    return;
  }
}
