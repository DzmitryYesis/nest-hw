import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogsQueryParams, BlogViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../../core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async getAllBlogs(
    query: BlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const { pageNumber, pageSize, sortBy, sortDirection, searchNameTerm } =
      query;

    const sortMap: Record<string, string> = {
      name: '"name" COLLATE "C"',
      description: '"description" COLLATE "C"',
      websiteUrl: '"websiteUrl" COLLATE "C"',
      blogStatus: '"blogStatus"',
      createdAt: '"createdAt"',
    };
    const orderBy = sortMap[sortBy];
    const direction = sortDirection.toUpperCase();

    const where: string[] = ['"blogStatus" <> $1', '"deletedAt" IS NULL'];
    const params: any[] = ['DELETED'];
    let i = 2;

    const orParts: string[] = [];
    if (searchNameTerm) {
      orParts.push(`"name" ILIKE $${i}`);
      params.push(`%${searchNameTerm}%`);
      i++;
    }
    if (orParts.length) where.push(`(${orParts.join(' OR ')})`);

    const sql = `
    SELECT
      *,
      COUNT(*) OVER()::int AS total_count
    FROM public."Blogs"
    WHERE ${where.join(' AND ')}
    ORDER BY ${orderBy} ${direction}
    LIMIT $${i} OFFSET $${i + 1};
  `;
    params.push(pageSize, (pageNumber - 1) * pageSize);

    const rows = await this.dataSource.query(sql, params);

    const totalCount = rows[0]?.total_count ?? 0;

    const items = rows.map(BlogViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getBlogById(id: string): Promise<BlogViewDto> {
    const res = await this.dataSource.query(
      'SELECT * FROM public."Blogs" WHERE "id" = $1::uuid',
      [id],
    );

    if (res.length === 0) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }

    return BlogViewDto.mapToView(res[0]);
  }
}
