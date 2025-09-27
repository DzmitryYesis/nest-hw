import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BlogRepository } from '../../infrastructure';
import { isUuidV4 } from '../../../../../utils/uuidValidator';

export class DeleteBlogCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(private blogRepository: BlogRepository) {}

  async execute(command: DeleteBlogCommand): Promise<void> {
    if (!isUuidV4(command.id)) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'id',
            message: 'Some problem',
          },
        ],
      });
    }

    const blog = await this.blogRepository.findBlogById(command.id);

    if (!blog) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Blog with id ${command.id} not found`,
          },
        ],
      });
    }

    await this.blogRepository.deleteBlog(blog);
  }
}
