import { CommentInputDto, CommentRepository } from '../../../comment';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../../user-accounts';
import { PostRepository } from '../../infrastructure';
import { NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from '../../../comment/dto/application/create-comment.dto';

export class CreateCommentForPostCommand {
  constructor(
    public id: string,
    public userId: string,
    public dto: CommentInputDto,
  ) {}
}

//TODO refactoring duplicate code
@CommandHandler(CreateCommentForPostCommand)
export class CreateCommentForPostUseCase
  implements ICommandHandler<CreateCommentForPostCommand>
{
  constructor(
    private userRepository: UsersRepository,
    private postRepository: PostRepository,
    private commentRepository: CommentRepository,
  ) {}

  async execute(command: CreateCommentForPostCommand): Promise<string> {
    const {
      userId,
      id,
      dto: { content },
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

    const [user] = await this.userRepository.findUserById(userId);

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

    const comment = {
      postId: post.id,
      content,
      userId: userId,
      userLogin: user.login,
    } as CreateCommentDto;

    return await this.commentRepository.createComment(comment);
  }
}
