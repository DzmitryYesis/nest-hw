import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PostRowDto } from '../dto/view-dto/post-row.dto';
import { LikeDislikeForPostDto } from '../dto/application/like-deslike-for-post.dto';

@Injectable()
export class PostRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async findPostById(id: string): Promise<PostRowDto | null> {
    const res = await this.dataSource.query(
      `SELECT
    p.*,
    COALESCE((
      SELECT json_agg(
               json_build_object(
                 'userId',  pld."userId",
                 'login',   pld."login",
                 'addedAt', pld."addedAt"
               )
               ORDER BY pld."addedAt" DESC
             )
      FROM public."PostsLikesDislikes" pld
      WHERE pld."postId" = p."id"
        AND pld."likeStatus" = 'LIKE'::like_status
    ), '[]'::json) AS likes,

    COALESCE((
      SELECT json_agg(
               json_build_object(
                 'userId',  pld."userId",
                 'login',   pld."login",
                 'addedAt', pld."addedAt"
               )
               ORDER BY pld."addedAt" DESC
             )
      FROM public."PostsLikesDislikes" pld
      WHERE pld."postId" = p."id"
        AND pld."likeStatus" = 'DISLIKE'::like_status
    ), '[]'::json) AS dislikes,

    COUNT(*) OVER()::int AS total_count

  FROM public."Posts" p
  WHERE "id" = $1::uuid AND "postStatus" <> 'DELETED'
    AND "deletedAt" IS NULL`,
      [id],
    );

    if (res.length === 0) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    return res[0];
  }

  async createPostForBlog(
    title: string,
    content: string,
    shortDescription: string,
    blogId: string,
    blogName: string,
  ): Promise<string> {
    const sql = `INSERT INTO public."Posts" ("title", "content", "shortDescription", "blogId", "blogName")
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING "id"`;

    const params = [title, content, shortDescription, blogId, blogName];

    const res = await this.dataSource.query(sql, params);

    return res[0].id;
  }

  async createLikesDislikes(dto: LikeDislikeForPostDto): Promise<void> {
    const { postId, userId, login, likeStatus } = dto;
    await this.dataSource.query(
      `INSERT INTO "PostsLikesDislikes" ("postId", "userId", "login", "addedAt", "likeStatus")
       VALUES ($1, $2, $3, NOW(), $4)
       ON CONFLICT ("postId", "userId")
       DO UPDATE SET
       "likeStatus" = EXCLUDED."likeStatus",
       "addedAt"    = NOW(),
       "login"      = EXCLUDED."login"`,
      [postId, userId, login, likeStatus],
    );
  }

  async updatePost(
    title: string,
    content: string,
    shortDescription: string,
    postId: string,
  ): Promise<boolean> {
    const sql = `UPDATE public."Posts"
               SET "title" = $1,
                   "content" = $2,
                   "shortDescription" = $3
               WHERE "id" = $4`;

    const params = [title, content, shortDescription, postId];

    const res = await this.dataSource.query(sql, params);

    return res.rowCount > 0;
  }

  async deletePost(id: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE public."Posts" SET "postStatus" = 'DELETED', "deletedAt" = now() WHERE "id" = $1::uuid`,
      [id],
    );
  }

  async deleteLikeDislike(postId: string, userId: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM public."PostsLikesDislikes" WHERE "postId" = $1 AND "userId" = $2`,
      [postId, userId],
    );
  }
}
