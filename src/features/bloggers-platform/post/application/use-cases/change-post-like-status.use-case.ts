import { BaseLikeStatusInputDto } from '../../../../../core/dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../../user-accounts';
import { PostRepository } from '../../infrastructure';
import { NotFoundException } from '@nestjs/common';
import { UserLikeStatus } from '../../../../../constants';
import { LikeDislikeForPostDto } from '../../dto/application/like-deslike-for-post.dto';

export class ChangePostLikeStatusCommand {
  constructor(
    public userId: string,
    public id: string,
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
      id,
      data: { likeStatus },
    } = command;

    const post = await this.postRepository.findPostById(id);

    if (!post) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Post with id ${id} not found`,
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
      postId: post.id,
      userId: userId,
      login: user.login,
      likeStatus: likeStatus.toUpperCase(),
    } as LikeDislikeForPostDto;

    if (likeStatus === UserLikeStatus.NONE) {
      await this.postRepository.deleteLikeDislike(post.id, userId);
    } else {
      await this.postRepository.createLikesDislikes(likeOrDislikeInfo);
    }
  }
}
