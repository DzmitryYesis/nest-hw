import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure';
import { NotFoundException } from '@nestjs/common';

export class DeletePostCommand {
  constructor(public postId: string) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(private postRepository: PostRepository) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const { postId } = command;
    const post = await this.postRepository.findPostById(postId);

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    await this.postRepository.deletePost(post);
  }
}
