import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BlogRepository } from '../../infrastructure';
import { BlogInputDto } from '../../dto';
import { isUuidV4 } from '../../../../../utils/uuidValidator';

export class UpdateBlogCommand {
  constructor(
    public id: string,
    public dto: BlogInputDto,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(private blogRepository: BlogRepository) {}

  async execute(command: UpdateBlogCommand): Promise<void> {
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

    return await this.blogRepository.updateBlog(blog.id, command.dto);
  }
}
