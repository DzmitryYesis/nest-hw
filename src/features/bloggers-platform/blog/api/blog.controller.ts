import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogQueryRepository } from '../infrastructure';
import { PaginatedViewDto } from '../../../../core';
import { BlogsQueryParams, BlogViewDto } from '../dto';
import { PostQueryRepository, PostsQueryParams, PostViewDto } from '../../post';
import { BLOGS_API_PATH, POSTS_API_PATH } from '../../../../constants';
import { CommandBus } from '@nestjs/cqrs';
import { GetBlogByIdCommand } from '../application/use-cases/get-blog-by-id.use-case';
import { Public } from '../../../../core/decorators';

@Public()
@Controller(BLOGS_API_PATH)
export class BlogController {
  constructor(
    private blogQueryRepository: BlogQueryRepository,
    private postQueryRepository: PostQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getAllBlogs(
    @Query() query: BlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const queryParams = new BlogsQueryParams(query);

    return this.blogQueryRepository.getAllBlogs(queryParams);
  }

  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogQueryRepository.getBlogById(id);
  }

  @Get(`:id/${POSTS_API_PATH.ROOT_URL}`)
  async getPostsForBlog(
    @Param('id') id: string,
    @Query() query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryParams = new PostsQueryParams(query);
    const blogId = await this.commandBus.execute(new GetBlogByIdCommand(id));

    return this.postQueryRepository.getPostsForBlog(blogId!, queryParams);
  }
}
