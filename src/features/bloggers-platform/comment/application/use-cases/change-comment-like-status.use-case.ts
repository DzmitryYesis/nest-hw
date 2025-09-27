import { BaseLikeStatusInputDto } from '../../../../../core/dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure';
import { UsersRepository } from '../../../../user-accounts';
import { NotFoundException } from '@nestjs/common';
import { LikeDislikeStatus } from '../../../../../constants';
import { LikeDislikeForCommentDto } from '../../dto/application/like-dislike-for-comment.dto';

export class ChangeCommentLikeStatusCommand {
  constructor(
    public userId: string,
    public commentId: string,
    public data: BaseLikeStatusInputDto,
  ) {}
}

@CommandHandler(ChangeCommentLikeStatusCommand)
export class ChangeCommentLikeStatusUseCase
  implements ICommandHandler<ChangeCommentLikeStatusCommand>
{
  constructor(
    private commentRepository: CommentRepository,
    private userRepository: UsersRepository,
  ) {}

  async execute(command: ChangeCommentLikeStatusCommand): Promise<void> {
    const {
      commentId,
      userId,
      data: { likeStatus },
    } = command;

    const comment = await this.commentRepository.findCommentById(commentId);

    if (!comment) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Comment with id ${commentId} not found`,
          },
        ],
      });
    }

    const user = await this.userRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `User with id ${userId} not found`,
          },
        ],
      });
    }

    const commentLikeDislike = await this.commentRepository.findLikeDislike(
      comment.id,
      userId,
    );

    if (commentLikeDislike) {
      await this.commentRepository.updateLikeDislikeStatus(
        commentLikeDislike,
        likeStatus.toUpperCase() as LikeDislikeStatus,
      );
    } else {
      const likeOrDislikeInfo = {
        commentId: comment.id,
        userId: userId,
        likeStatus: likeStatus.toUpperCase(),
      } as LikeDislikeForCommentDto;

      await this.commentRepository.createLikeDislike(likeOrDislikeInfo);
    }
  }
}
