import { BaseLikeStatusInputDto } from '../../../../../core/dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure';
import { UsersRepository } from '../../../../user-accounts';
import { NotFoundException } from '@nestjs/common';
import { UserLikeStatus } from '../../../../../constants';
import { LikeDislikeForCommentDto } from '../../dto/application/like-dislike-for-comment.dto';

export class ChangeCommentLikeStatusCommand {
  constructor(
    public userId: string,
    public id: string,
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
      id,
      userId,
      data: { likeStatus },
    } = command;

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

    const user = await this.userRepository.findUserById(userId);

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

    const likeOrDislikeInfo = {
      commentId: id,
      userId: userId,
      likeStatus: likeStatus.toUpperCase(),
    } as LikeDislikeForCommentDto;

    if (likeStatus === UserLikeStatus.NONE) {
      await this.commentRepository.deleteLikeDislike(id, userId);
    } else {
      await this.commentRepository.createLikesDislikes(likeOrDislikeInfo);
    }
  }
}
