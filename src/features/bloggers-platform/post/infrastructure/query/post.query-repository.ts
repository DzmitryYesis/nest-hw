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

    // totalCount без join/агрегатов
    const totalCount = await this.postsRepo
      .createQueryBuilder('p')
      .where('p.postStatus <> :del', { del: PostStatusEnum.DELETED })
      .andWhere('p.deletedAt IS NULL')
      .getCount();

    // записи + агрегаты реакций
    const qb = this.postsRepo
      .createQueryBuilder('p')
      .select('p') // важно для корректного маппинга сущности
      .where('p.postStatus <> :del', { del: PostStatusEnum.DELETED })
      .andWhere('p.deletedAt IS NULL')
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

    // простая сортировка по свойствам сущности (никаких кавычек у алиаса и выражений)
    const a = qb.alias; // 'p'
    const sortMap: Record<string, string> = {
      title: `${a}.title`,
      shortDescription: `${a}.shortDescription`,
      content: `${a}.content`,
      blogId: `${a}.blogId`,
      blogName: `${a}.blogName`,
      createdAt: `${a}.createdAt`,
    };
    qb.orderBy(sortMap[sortBy] ?? `${a}.createdAt`, dir)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize);

    const { raw, entities } = await qb.getRawAndEntities();

    // приклеиваем JSON-поля
    const byId = new Map(entities.map((e) => [e.id, e as any]));
    for (const r of raw) {
      const id = r[`${a}_id`]; // 'p_id'
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
      page: pageNumber,
      size: pageSize,
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

    const totalCount = await this.postsRepo
      .createQueryBuilder('p')
      .where('p.blogId = :blogId', { blogId })
      .andWhere('p.postStatus <> :del', { del: PostStatusEnum.DELETED })
      .andWhere('p.deletedAt IS NULL')
      .getCount();

    const itemsQb = this.postsRepo
      .createQueryBuilder('p')
      .select('p')
      .where('p.blogId = :blogId', { blogId })
      .andWhere('p.postStatus <> :del', { del: PostStatusEnum.DELETED })
      .andWhere('p.deletedAt IS NULL')
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

    const a = itemsQb.alias;
    const sortMap: Record<string, string> = {
      title: `${a}.title`,
      shortDescription: `${a}.shortDescription`,
      content: `${a}.content`,
      blogId: `${a}.blogId`,
      blogName: `${a}.blogName`,
      createdAt: `${a}.createdAt`,
    };

    const sortExpr = sortMap[sortBy] ?? `${a}.createdAt`;
    itemsQb.orderBy(sortExpr, dir);

    itemsQb.skip((pageNumber - 1) * pageSize).take(pageSize);

    const { raw, entities } = await itemsQb.getRawAndEntities();

    const byId = new Map(entities.map((e) => [e.id, e as any]));
    for (const r of raw) {
      const id = r['p_id'];
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
