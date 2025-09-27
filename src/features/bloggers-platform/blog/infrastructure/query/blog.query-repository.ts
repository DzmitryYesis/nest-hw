import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogsQueryParams, BlogViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../../core';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { Blog } from '../../domain';
import { BlogStatusEnum } from '../../../../../constants';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Blog)
    private readonly blogsRepo: Repository<Blog>,
  ) {}

  async getAllBlogs(
    query: BlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const { pageNumber, pageSize, sortBy, sortDirection, searchNameTerm } =
      query;

    const qb = this.blogsRepo
      .createQueryBuilder('b')
      .where('b.blogStatus <> :deleted', { deleted: BlogStatusEnum.DELETED })
      .andWhere('b.deletedAt IS NULL');

    if (searchNameTerm) {
      qb.andWhere('b.name ILIKE :name', { name: `%${searchNameTerm}%` });
    }

    const dir: 'ASC' | 'DESC' =
      String(sortDirection).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sortMap: Record<string, string> = {
      name: `"b"."name" COLLATE "C"`,
      description: `"b"."description" COLLATE "C"`,
      websiteUrl: `"b"."websiteUrl" COLLATE "C"`,
      blogStatus: 'b.blogStatus',
      createdAt: 'b.createdAt',
    };

    qb.orderBy(sortMap[sortBy] ?? 'b.createdAt', dir);
    qb.skip((pageNumber - 1) * pageSize).take(pageSize);

    const [items, totalCount] = await qb.getManyAndCount();

    const viewItems = items.map(BlogViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items: viewItems,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getBlogById(id: string): Promise<BlogViewDto> {
    const blog = await this.blogsRepo.findOne({
      where: {
        id,
        blogStatus: Not(BlogStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }

    return BlogViewDto.mapToView(blog);
  }
}
