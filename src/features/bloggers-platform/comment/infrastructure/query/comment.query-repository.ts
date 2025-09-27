import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentsQueryParams, CommentViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../../core';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { Comment } from '../../domain';
import { CommentStatusEnum } from '../../../../../constants';

@Injectable()
export class CommentQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
  ) {}

  async getCommentById(id: string, userId?: string): Promise<CommentViewDto> {
    const comment = await this.commentsRepo.findOne({
      where: {
        id,
        commentStatus: Not(CommentStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
      relations: {
        commentLikesDislikes: true,
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return CommentViewDto.mapToView(comment, userId);
  }

  async getCommentsForPost(
    postId: string,
    query: CommentsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const { pageNumber, pageSize, sortBy, sortDirection } = query;
    const dir: 'ASC' | 'DESC' =
      String(sortDirection).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 1) totalCount — без join/агрегатов
    const totalCount = await this.commentsRepo
      .createQueryBuilder('c')
      .where('c.postId = :postId', { postId })
      .andWhere('c.commentStatus <> :del', { del: CommentStatusEnum.DELETED })
      .andWhere('c.deletedAt IS NULL')
      .getCount();

    // 2) сами записи + JSON-агрегаты реакций
    const qb = this.commentsRepo
      .createQueryBuilder('c')
      .where('c.postId = :postId', { postId })
      .andWhere('c.commentStatus <> :del', { del: CommentStatusEnum.DELETED })
      .andWhere('c.deletedAt IS NULL')
      // Замените 'c.commentLikes' на имя вашей связи, если иное (например, 'c.commentLikesDislikes')
      .leftJoin('c.commentLikesDislikes', 'cl')
      .addSelect(
        `COALESCE(
        json_agg(
          json_build_object(
            'userId',  cl."userId",
            'addedAt', cl."addedAt"
          )
          ORDER BY cl."addedAt" DESC
        ) FILTER (WHERE cl."likeStatus" = 'LIKE'),
        '[]'::json
      )`,
        'likes',
      )
      .addSelect(
        `COALESCE(
        json_agg(
          json_build_object(
            'userId',  cl."userId",
            'addedAt', cl."addedAt"
          )
          ORDER BY cl."addedAt" DESC
        ) FILTER (WHERE cl."likeStatus" = 'DISLIKE'),
        '[]'::json
      )`,
        'dislikes',
      )
      .groupBy('c.id');

    // сортировка
    const sortMap: Record<string, string> = {
      content: `"c"."content" COLLATE "C"`,
      createdAt: `c.createdAt`,
    };
    qb.orderBy(sortMap[sortBy] ?? 'c.createdAt', dir)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize);

    const { raw, entities } = await qb.getRawAndEntities();

    // приклеиваем JSON-поля к сущностям
    const byId = new Map(entities.map((e) => [e.id, e as any]));
    for (const r of raw) {
      const id = r['c_id']; // alias первичного ключа из 'c'
      const ent = byId.get(id);
      if (ent) {
        ent.likes = r.likes ?? [];
        ent.dislikes = r.dislikes ?? [];
      }
    }

    const items = entities.map((comment) =>
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
