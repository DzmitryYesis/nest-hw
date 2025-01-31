import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentRepository } from '../infrastructure';
import { ObjectId } from 'mongodb';
import { CommentInputDto } from '../dto';
import { BaseLikeStatusInputDto } from '../../../../core/dto';
import { BaseLikesDislikesDBData } from '../../../../core';
import { UserLikeStatus } from '../../../../constants';
import { UsersRepository } from '../../../user-accounts';

@Injectable()
export class CommentService {
  constructor(
    private commentRepository: CommentRepository,
    private userRepository: UsersRepository,
  ) {}

  async updateComment(
    id: ObjectId,
    dto: CommentInputDto,
    userId: string,
  ): Promise<void> {
    const comment = await this.commentRepository.findCommentById(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    if (comment.commentatorInfo.userId !== userId) {
      throw new ForbiddenException("You can't do it");
    }

    comment.updateComment(dto);

    await this.commentRepository.save(comment);
  }

  async likeStatus(
    userId: string,
    id: ObjectId,
    data: BaseLikeStatusInputDto,
  ): Promise<void> {
    const comment = await this.commentRepository.findCommentById(id);

    if (!comment) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Comment with id ${id} not found`,
          },
        ],
      });
    }

    const user = await this.userRepository.findByCredentials(
      '_id',
      new ObjectId(userId),
    );

    if (!user) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `User with id ${id} not found`,
          },
        ],
      });
    }

    const likesArr = comment.likesInfo.likes.map((l) => l.userId);
    const dislikesArr = comment.likesInfo.dislikes.map((d) => d.userId);
    const likeOrDislikeInfo = {
      userId: userId,
      login: user.login,
      addedAt: new Date(),
    } as BaseLikesDislikesDBData;

    if (data.likeStatus === UserLikeStatus.LIKE) {
      if (!likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        comment.addLikeOrDislike('likes', likeOrDislikeInfo);
      }
      if (!likesArr.includes(userId) && dislikesArr.includes(userId)) {
        comment.deleteLikeOrDislike('dislikes', userId);
        comment.addLikeOrDislike('likes', likeOrDislikeInfo);
      }
    }

    if (data.likeStatus === UserLikeStatus.DISLIKE) {
      if (!likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        comment.addLikeOrDislike('dislikes', likeOrDislikeInfo);
      }
      if (likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        comment.deleteLikeOrDislike('likes', userId);
        comment.addLikeOrDislike('dislikes', likeOrDislikeInfo);
      }
    }

    if (data.likeStatus === UserLikeStatus.NONE) {
      if (likesArr.includes(userId)) {
        comment.deleteLikeOrDislike('likes', userId);
      }

      if (dislikesArr.includes(userId)) {
        comment.deleteLikeOrDislike('dislikes', userId);
      }
    }

    await this.commentRepository.save(comment);
  }

  async deleteComment(id: ObjectId, userId: string): Promise<void> {
    const comment = await this.commentRepository.findCommentById(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    if (comment.commentatorInfo.userId !== userId) {
      throw new ForbiddenException("You can't do it");
    }

    comment.deleteComment();

    await this.commentRepository.save(comment);
  }
}
