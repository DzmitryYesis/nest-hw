import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from '../dto/application/create-comment.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentRowDto } from '../dto/input-dto/comment-row.dto';
import { LikeDislikeForCommentDto } from '../dto/application/like-dislike-for-comment.dto';

@Injectable()
export class CommentRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async findCommentById(id: string): Promise<CommentRowDto | null> {
    const res = await this.dataSource.query(
      `SELECT * FROM public."Comments" WHERE "id" = $1::uuid AND "commentStatus" <> 'DELETED'
    AND "deletedAt" IS NULL`,
      [id],
    );

    if (res.length === 0) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return res[0];
  }

  async createComment(dto: CreateCommentDto): Promise<string> {
    const { postId, content, userId, userLogin } = dto;

    const res = await this.dataSource.query(
      `INSERT INTO public."Comments" ("postId", "content", "userId", "userLogin")
       VALUES ($1, $2, $3, $4)
       RETURNING "id"`,
      [postId, content, userId, userLogin],
    );

    return res[0].id;
  }

  async createLikesDislikes(dto: LikeDislikeForCommentDto): Promise<void> {
    const { commentId, userId, likeStatus } = dto;
    await this.dataSource.query(
      `INSERT INTO "CommentsLikesDislikes" ("commentId", "userId", "addedAt", "likeStatus")
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT ("commentId", "userId")
       DO UPDATE SET
       "likeStatus" = EXCLUDED."likeStatus",
       "addedAt"    = NOW()`,
      [commentId, userId, likeStatus],
    );
  }

  async updateComment(commentId: string, content: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE public."Comments" 
       SET "content" = $2, "updatedAt" = now() 
       WHERE "id" = $1`,
      [commentId, content],
    );
  }

  async deleteComment(id: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE public."Comments" SET "commentStatus" = 'DELETED', "deletedAt" = now() WHERE "id" = $1::uuid`,
      [id],
    );
  }

  async deleteLikeDislike(commentId: string, userId: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM public."CommentsLikesDislikes" WHERE "commentId" = $1 AND "userId" = $2`,
      [commentId, userId],
    );
  }
}
