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
} from '@nestjs/common';
import { BlogService } from '../application';
import { BlogQueryRepository } from '../infrastructure';
import { PaginatedViewDto } from '../../../../core/dto';
import {
  BlogInputDto,
  BlogsQueryParams,
  BlogViewDto,
  PostForBlogInputDto,
} from '../dto';
import { ObjectId } from 'mongodb';
import { PostQueryRepository, PostViewDto } from '../../post';

@Controller('blogs')
export class BlogController {
  constructor(
    private blogService: BlogService,
    private blogQueryRepository: BlogQueryRepository,
    private postQueryRepository: PostQueryRepository,
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
    return this.blogQueryRepository.getBlogById(new ObjectId(id));
  }

  @Post()
  async createBlog(@Body() data: BlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.blogService.createBlog(data);

    return this.blogQueryRepository.getBlogById(blogId);
  }

  @Post(':id/posts')
  async createPostForBlog(
    @Param('id') id: string,
    @Body() data: PostForBlogInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.blogService.createPostForBlog(id, data);

    return this.postQueryRepository.getPostById(postId!);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: string,
    @Body() data: BlogInputDto,
  ): Promise<void> {
    return this.blogService.updateBlog(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    return this.blogService.deleteBlogById(id);
  }
}
