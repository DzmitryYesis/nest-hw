import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

export class DeleteCommentCommand {
  constructor(
    public id: string,
    public userId: string,
  ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(private commentRepository: CommentRepository) {}

  async execute(command: DeleteCommentCommand): Promise<void> {
    const { id, userId } = command;

    const comment = await this.commentRepository.findCommentById(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException("You can't do it");
    }

    await this.commentRepository.deleteComment(comment);
  }
}
