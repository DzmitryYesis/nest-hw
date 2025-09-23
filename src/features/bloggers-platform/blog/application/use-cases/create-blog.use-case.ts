import { BlogInputDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogRepository } from '../../infrastructure';

export class CreateBlogCommand {
  constructor(public dto: BlogInputDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(private blogRepository: BlogRepository) {}

  async execute(command: CreateBlogCommand): Promise<string> {
    const { name, description, websiteUrl } = command.dto;

    return await this.blogRepository.createBlog(name, description, websiteUrl);
  }
}
