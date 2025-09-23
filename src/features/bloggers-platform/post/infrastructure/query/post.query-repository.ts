import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsQueryParams, PostViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../../core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PostQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async getAllPosts(
    query: PostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;

    const sortMap: Record<string, string> = {
      title: '"title" COLLATE "C"',
      shortDescription: '"shortDescription" COLLATE "C"',
      content: '"content" COLLATE "C"',
      blogId: '"blogId"',
      blogName: '"blogName" COLLATE "C"',
      createdAt: '"createdAt"',
    };
    const orderBy = sortMap[sortBy];
    const direction = sortDirection.toUpperCase();

    const where: string[] = ['"postStatus" <> $1', '"deletedAt" IS NULL'];
    const params: any[] = ['DELETED'];
    const i = 2;

    const sql = `
  SELECT
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
  WHERE ${where.join(' AND ')}
  ORDER BY ${orderBy} ${direction}
  LIMIT $${i} OFFSET $${i + 1};
`;
    params.push(pageSize, (pageNumber - 1) * pageSize);

    const rows = await this.dataSource.query(sql, params);

    const totalCount = rows[0]?.total_count ?? 0;

    const items = rows.map((post) => PostViewDto.mapToView(post, userId));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getPostById(id: string, userId?: string): Promise<PostViewDto> {
    const res = await this.dataSource.query(
      'SELECT * FROM public."Posts" WHERE "id" = $1::uuid',
      [id],
    );

    if (res.length === 0) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    const post = {
      ...res[0],
      likes: [],
      dislikes: [],
    };

    return PostViewDto.mapToView(post, userId);
  }

  async getPostsForBlog(
    id: string,
    query: PostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;

    const sortMap: Record<string, string> = {
      title: '"title" COLLATE "C"',
      shortDescription: '"shortDescription" COLLATE "C"',
      content: '"content" COLLATE "C"',
      blogId: '"blogId"',
      blogName: '"blogName"',
      createdAt: '"createdAt"',
    };
    const orderBy = sortMap[sortBy];
    const direction = sortDirection.toUpperCase();

    const where: string[] = [
      '"blogId" = $1',
      '"postStatus" <> $2',
      '"deletedAt" IS NULL',
    ];
    const params: any[] = [id, 'DELETED'];
    const i = 3;

    const sql = `
  SELECT
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
  WHERE ${where.join(' AND ')}
  ORDER BY ${orderBy} ${direction}
  LIMIT $${i} OFFSET $${i + 1};
`;
    params.push(pageSize, (pageNumber - 1) * pageSize);

    const rows = await this.dataSource.query(sql, params);

    const totalCount = rows[0]?.total_count ?? 0;

    const items = rows.map((post) => PostViewDto.mapToView(post, userId));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
