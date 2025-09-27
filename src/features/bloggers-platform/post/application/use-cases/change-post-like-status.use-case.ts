import { BaseLikeStatusInputDto } from '../../../../../core/dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../../user-accounts';
import { PostRepository } from '../../infrastructure';
import { NotFoundException } from '@nestjs/common';
import { LikeDislikeStatus } from '../../../../../constants';
import { LikeDislikeForPostDto } from '../../dto/application/like-deslike-for-post.dto';

export class ChangePostLikeStatusCommand {
  constructor(
    public userId: string,
    public postId: string,
    public data: BaseLikeStatusInputDto,
  ) {}
}

@CommandHandler(ChangePostLikeStatusCommand)
export class ChangePostLikeStatusUseCase
  implements ICommandHandler<ChangePostLikeStatusCommand>
{
  constructor(
    private userRepository: UsersRepository,
    private postRepository: PostRepository,
  ) {}

  async execute(command: ChangePostLikeStatusCommand): Promise<void> {
    const {
      userId,
      postId,
      data: { likeStatus },
    } = command;

    const post = await this.postRepository.findPostById(postId);

    if (!post) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Post with id ${postId} not found`,
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

    const postLikeDislike = await this.postRepository.findLikeDislike(
      postId,
      userId,
    );

    if (postLikeDislike) {
      await this.postRepository.updateLikeDislikeStatus(
        postLikeDislike,
        likeStatus.toUpperCase() as LikeDislikeStatus,
      );
    } else {
      const likeOrDislikeInfo = {
        postId: post.id,
        userId: userId,
        login: user.login,
        likeStatus: likeStatus.toUpperCase(),
      } as LikeDislikeForPostDto;

      await this.postRepository.createLikeDislike(likeOrDislikeInfo);
    }
  }
}
