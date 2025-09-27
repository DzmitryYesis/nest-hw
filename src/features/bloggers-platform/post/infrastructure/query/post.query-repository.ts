import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsQueryParams, PostViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../../core';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { Post } from '../../domain';
import { LikeDislikeStatus, PostStatusEnum } from '../../../../../constants';
import { PostRowDto } from '../../dto/view-dto/post-row.dto';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,
  ) {}

  async getAllPosts(
    query: PostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;
    const dir: 'ASC' | 'DESC' =
      String(sortDirection).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 1) totalCount — без join/агрегатов
    const totalCount = await this.postsRepo
      .createQueryBuilder('p')
      .where('p.postStatus <> :del', { del: PostStatusEnum.DELETED })
      .andWhere('p.deletedAt IS NULL')
      .getCount();

    // 2) записи + агрегаты реакций
    const qb = this.postsRepo
      .createQueryBuilder('p')
      .where('p.postStatus <> :del', { del: PostStatusEnum.DELETED })
      .andWhere('p.deletedAt IS NULL')
      // Если у тебя связь называется по-другому — подставь её сюда:
      .leftJoin('p.postLikesDislikes', 'pld')
      .addSelect(
        `COALESCE(
        json_agg(
          json_build_object(
            'userId',  pld."userId",
            'login',   pld."login",
            'addedAt', pld."addedAt"
          )
          ORDER BY pld."addedAt" DESC
        ) FILTER (WHERE pld."likeStatus" = 'LIKE'),
        '[]'::json
      )`,
        'likes',
      )
      .addSelect(
        `COALESCE(
        json_agg(
          json_build_object(
            'userId',  pld."userId",
            'login',   pld."login",
            'addedAt', pld."addedAt"
          )
          ORDER BY pld."addedAt" DESC
        ) FILTER (WHERE pld."likeStatus" = 'DISLIKE'),
        '[]'::json
      )`,
        'dislikes',
      )
      .groupBy('p.id');

    // сортировка (со строковым COLLATE "C", как в твоём SQL)
    const sortMap: Record<string, string> = {
      title: `"p"."title" COLLATE "C"`,
      shortDescription: `"p"."shortDescription" COLLATE "C"`,
      content: `"p"."content" COLLATE "C"`,
      blogId: `p.blogId`,
      blogName: `"p"."blogName" COLLATE "C"`,
      createdAt: `p.createdAt`,
    };
    qb.orderBy(sortMap[sortBy] ?? 'p.createdAt', dir)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize);

    const { raw, entities } = await qb.getRawAndEntities();

    // приклеим JSON-массивы к сущностям
    const byId = new Map(entities.map((e) => [e.id, e as any]));
    for (const r of raw) {
      const id = r['p_id']; // alias primary key из 'p'
      const ent = byId.get(id);
      if (ent) {
        ent.likes = r.likes ?? [];
        ent.dislikes = r.dislikes ?? [];
      }
    }

    const items = entities.map((post) =>
      PostViewDto.mapToView(post as unknown as PostRowDto, userId),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getPostById(id: string, userId?: string): Promise<PostViewDto> {
    const post = await this.postsRepo.findOne({
      where: {
        id,
        postStatus: Not(PostStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
      relations: {
        postLikesDislikes: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    const postEntity = {
      ...post,
      likes: post.postLikesDislikes.filter(
        (p) => p.likeStatus === LikeDislikeStatus.LIKE,
      ),
      dislikes: post.postLikesDislikes.filter(
        (p) => p.likeStatus === LikeDislikeStatus.DISLIKE,
      ),
    };

    return PostViewDto.mapToView(postEntity as unknown as PostRowDto, userId);
  }

  async getPostsForBlog(
    blogId: string,
    query: PostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;
    const dir: 'ASC' | 'DESC' =
      String(sortDirection).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 1) count — без join/агрегаций (быстро и просто)
    const totalCount = await this.postsRepo
      .createQueryBuilder('p')
      .where('p.blogId = :blogId', { blogId })
      .andWhere('p.postStatus <> :del', { del: PostStatusEnum.DELETED })
      .andWhere('p.deletedAt IS NULL')
      .getCount();

    // 2) сами записи + агрегаты лайков
    const itemsQb = this.postsRepo
      .createQueryBuilder('p')
      .where('p.blogId = :blogId', { blogId })
      .andWhere('p.postStatus <> :del', { del: PostStatusEnum.DELETED })
      .andWhere('p.deletedAt IS NULL')
      // лайки/дизлайки одним проходом
      .leftJoin('p.postLikesDislikes', 'pld')
      .addSelect(
        `COALESCE(
        json_agg(
          json_build_object(
            'userId',  pld."userId",
            'login',   pld."login",
            'addedAt', pld."addedAt"
          )
          ORDER BY pld."addedAt" DESC
        ) FILTER (WHERE pld."likeStatus" = 'LIKE'),
        '[]'::json
      )`,
        'likes',
      )
      .addSelect(
        `COALESCE(
        json_agg(
          json_build_object(
            'userId',  pld."userId",
            'login',   pld."login",
            'addedAt', pld."addedAt"
          )
          ORDER BY pld."addedAt" DESC
        ) FILTER (WHERE pld."likeStatus" = 'DISLIKE'),
        '[]'::json
      )`,
        'dislikes',
      )
      .groupBy('p.id');

    // сортировка с COLLATE "C" для строковых
    const sortMap: Record<string, string> = {
      title: `"p"."title" COLLATE "C"`,
      shortDescription: `"p"."shortDescription" COLLATE "C"`,
      content: `"p"."content" COLLATE "C"`,
      blogId: `p.blogId`,
      blogName: `"p"."blogName" COLLATE "C"`,
      createdAt: `p.createdAt`,
    };
    itemsQb.orderBy(sortMap[sortBy] ?? 'p.createdAt', dir);

    // пагинация
    itemsQb.skip((pageNumber - 1) * pageSize).take(pageSize);

    // получаем и сущности, и сырые колонки с json
    const { raw, entities } = await itemsQb.getRawAndEntities();

    // приклеим likes/dislikes к сущностям
    const byId = new Map(entities.map((e) => [e.id, e as any]));
    for (const r of raw) {
      const id = r['p_id']; // alias поля id из таблицы p.*
      const ent = byId.get(id);
      if (ent) {
        ent.likes = r.likes ?? [];
        ent.dislikes = r.dislikes ?? [];
      }
    }

    const items = entities.map((post) =>
      PostViewDto.mapToView(post as unknown as PostRowDto, userId),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
