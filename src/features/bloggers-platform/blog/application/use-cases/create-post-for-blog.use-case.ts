import { PostForBlogInputDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../../post';
import { BlogRepository } from '../../infrastructure';
import { forwardRef, Inject, NotFoundException } from '@nestjs/common';

export class CreatePostForBlogCommand {
  constructor(
    public blogId: string,
    public dto: PostForBlogInputDto,
  ) {}
}

//TODO refactoring forwardRef
@CommandHandler(CreatePostForBlogCommand)
export class CreatePostForBlogUseCase
  implements ICommandHandler<CreatePostForBlogCommand>
{
  constructor(
    private blogRepository: BlogRepository,
    @Inject(forwardRef(() => PostRepository))
    private postRepository: PostRepository,
  ) {}

  async execute(command: CreatePostForBlogCommand): Promise<string | void> {
    const {
      blogId,
      dto: { title, content, shortDescription },
    } = command;

    const blog = await this.blogRepository.findBlogById(blogId);

    if (!blog) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Blog with id ${blogId} not found`,
          },
        ],
      });
    }

    return await this.postRepository.createPostForBlog(
      title,
      content,
      shortDescription,
      blogId,
      blog.name,
    );
  }
}
