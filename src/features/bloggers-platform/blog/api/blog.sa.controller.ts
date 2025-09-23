import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlogQueryRepository } from '../infrastructure';
import { BasicAuthGuard, PaginatedViewDto } from '../../../../core';
import {
  BlogInputDto,
  BlogsQueryParams,
  BlogViewDto,
  PostForBlogInputDto,
} from '../dto';
import {
  PostQueryRepository,
  PostsQueryParams,
  PostViewDto,
  UpdatePostForBlogInputDto,
} from '../../post';
import { BLOGS_SA_API_PATH, POSTS_API_PATH } from '../../../../constants';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/use-cases/create-blog.use-case';
import { CreatePostForBlogCommand } from '../application/use-cases/create-post-for-blog.use-case';
import { GetBlogByIdCommand } from '../application/use-cases/get-blog-by-id.use-case';
import { UpdateBlogCommand } from '../application/use-cases/update-blog.use-case';
import { DeleteBlogCommand } from '../application/use-cases/delete-blog.use-case';
import { UpdatePostCommand } from '../../post/application/use-cases/update-post.use-case';
import { DeletePostCommand } from '../../post/application/use-cases/delete-post.use-case';

@UseGuards(BasicAuthGuard)
@Controller(BLOGS_SA_API_PATH)
export class BlogSAController {
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

  @Get(`:id/${POSTS_API_PATH.ROOT_URL}`)
  async getPostsForBlog(
    @Req() req: Request & { userId: string },
    @Param('id') id: string,
    @Query() query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryParams = new PostsQueryParams(query);
    const blogId = await this.commandBus.execute(new GetBlogByIdCommand(id));

    return this.postQueryRepository.getPostsForBlog(
      blogId!,
      queryParams,
      req.userId,
    );
  }

  @Post()
  async createBlog(@Body() data: BlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.commandBus.execute(new CreateBlogCommand(data));

    return this.blogQueryRepository.getBlogById(blogId);
  }

  @Post(`:id/${POSTS_API_PATH.ROOT_URL}`)
  async createPostForBlog(
    @Param('id') blogId: string,
    @Body() data: PostForBlogInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.commandBus.execute(
      new CreatePostForBlogCommand(blogId, data),
    );

    return this.postQueryRepository.getPostById(postId!);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: string,
    @Body() data: BlogInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(new UpdateBlogCommand(id, data));
  }

  @Put(`:blogId/${POSTS_API_PATH.ROOT_URL}/:postId`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() data: UpdatePostForBlogInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new GetBlogByIdCommand(blogId));
    return await this.commandBus.execute(new UpdatePostCommand(postId, data));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    return await this.commandBus.execute(new DeleteBlogCommand(id));
  }

  @Delete(`:blogId/${POSTS_API_PATH.ROOT_URL}/:postId`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    await this.commandBus.execute(new GetBlogByIdCommand(blogId));
    return await this.commandBus.execute(new DeletePostCommand(postId));
  }
}
