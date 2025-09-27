import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from '../dto/application/create-comment.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { LikeDislikeForCommentDto } from '../dto/application/like-dislike-for-comment.dto';
import { Comment } from '../domain';
import { CommentStatusEnum, LikeDislikeStatus } from '../../../../constants';
import { CommentLikeDislike } from '../domain/comment-like-dislike.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
    @InjectRepository(CommentLikeDislike)
    private readonly commentLikeDislikeRepo: Repository<CommentLikeDislike>,
  ) {}

  async findCommentById(id: string): Promise<Comment | null> {
    const comment = await this.commentsRepo.findOne({
      where: {
        id,
        commentStatus: Not(CommentStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return comment;
  }

  async findLikeDislike(
    commentId: string,
    userId: string,
  ): Promise<CommentLikeDislike | null> {
    return await this.commentLikeDislikeRepo.findOne({
      where: {
        commentId,
        userId,
      },
    });
  }

  async createComment(dto: CreateCommentDto): Promise<string> {
    const { postId, content, userId, userLogin } = dto;

    const comment = this.commentsRepo.create({
      postId,
      content,
      userId,
      userLogin,
    });

    await this.commentsRepo.save(comment);

    return comment.id;
  }

  async createLikeDislike(dto: LikeDislikeForCommentDto): Promise<void> {
    const { commentId, userId, likeStatus } = dto;
    const likeDislike = this.commentLikeDislikeRepo.create({
      commentId,
      userId,
      likeStatus: likeStatus as LikeDislikeStatus,
    });

    await this.commentLikeDislikeRepo.save(likeDislike);
  }

  async updateComment(comment: Comment, content: string): Promise<void> {
    comment.content = content;

    await this.commentsRepo.save(comment);
  }

  async updateLikeDislikeStatus(
    commentLikeDislike: CommentLikeDislike,
    likeStatus: LikeDislikeStatus,
  ): Promise<void> {
    commentLikeDislike.likeStatus = likeStatus;

    await this.commentLikeDislikeRepo.save(commentLikeDislike);
  }

  async deleteComment(comment: Comment): Promise<void> {
    comment.commentStatus = CommentStatusEnum.DELETED;
    comment.deletedAt = new Date();

    await this.commentsRepo.save(comment);
  }
}
