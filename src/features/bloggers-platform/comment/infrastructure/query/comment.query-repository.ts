import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentsQueryParams, CommentViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../../core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommentQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async getCommentById(id: string, userId?: string): Promise<CommentViewDto> {
    const res = await this.dataSource.query(
      `
  SELECT 
    c.*,
    COALESCE((
      SELECT json_agg(
               json_build_object(
                 'userId',  cld."userId",
                 'addedAt', cld."addedAt"
               )
               ORDER BY cld."addedAt" DESC
             )
      FROM public."CommentsLikesDislikes" cld
      WHERE cld."commentId" = c."id"
        AND cld."likeStatus" = 'LIKE'::like_status
    ), '[]'::json) AS likes,

    COALESCE((
      SELECT json_agg(
               json_build_object(
                 'userId',  cld."userId",
                 'addedAt', cld."addedAt"
               )
               ORDER BY cld."addedAt" DESC
             )
      FROM public."CommentsLikesDislikes" cld
      WHERE cld."commentId" = c."id"
        AND cld."likeStatus" = 'DISLIKE'::like_status
    ), '[]'::json) AS dislikes

  FROM public."Comments" c 
  WHERE c."id" = $1::uuid
    AND c."commentStatus" <> 'DELETED'
    AND c."deletedAt" IS NULL
  `,
      [id],
    );

    if (res.length === 0) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return CommentViewDto.mapToView(res[0], userId);
  }

  async getCommentsForPost(
    id: string,
    query: CommentsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;

    const sortMap: Record<string, string> = {
      content: '"content" COLLATE "C"',
      createdAt: '"createdAt"',
    };
    const orderBy = sortMap[sortBy];
    const direction = sortDirection.toUpperCase();

    const where: string[] = [
      '"postId" = $1',
      '"commentStatus" <> $2',
      '"deletedAt" IS NULL',
    ];
    const params: any[] = [id, 'DELETED'];
    const i = 3;

    const sql = `
  SELECT
    c.*,
    COALESCE((
      SELECT json_agg(
               json_build_object(
                 'userId',  cld."userId",
                 'addedAt', cld."addedAt"
               )
               ORDER BY cld."addedAt" DESC
             )
      FROM public."CommentsLikesDislikes" cld
      WHERE cld."commentId" = c."id"
        AND cld."likeStatus" = 'LIKE'::like_status
    ), '[]'::json) AS likes,

    COALESCE((
      SELECT json_agg(
               json_build_object(
                 'userId',  cld."userId",
                 'addedAt', cld."addedAt"
               )
               ORDER BY cld."addedAt" DESC
             )
      FROM public."CommentsLikesDislikes" cld
      WHERE cld."commentId" = c."id"
        AND cld."likeStatus" = 'DISLIKE'::like_status
    ), '[]'::json) AS dislikes,

    COUNT(*) OVER()::int AS total_count

  FROM public."Comments" c
  WHERE ${where.join(' AND ')}
  ORDER BY ${orderBy} ${direction}
  LIMIT $${i} OFFSET $${i + 1};
`;
    params.push(pageSize, (pageNumber - 1) * pageSize);

    const rows = await this.dataSource.query(sql, params);

    const totalCount = rows[0]?.total_count ?? 0;

    const items = rows.map((comment) =>
      CommentViewDto.mapToView(comment, userId),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
