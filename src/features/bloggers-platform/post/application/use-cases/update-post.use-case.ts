import { UpdatePostForBlogInputDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure';
import { NotFoundException } from '@nestjs/common';

export class UpdatePostCommand {
  constructor(
    public postId: string,
    public dto: UpdatePostForBlogInputDto,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(private postRepository: PostRepository) {}

  async execute(command: UpdatePostCommand): Promise<void> {
    const {
      postId,
      dto: { title, content, shortDescription },
    } = command;

    const post = await this.postRepository.findPostById(postId);

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    return await this.postRepository.updatePost(
      title,
      content,
      shortDescription,
      postId,
    );
  }
}
