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
  UseGuards,
} from '@nestjs/common';
import { BlogService } from '../application';
import { BlogQueryRepository } from '../infrastructure';
import { BasicAuthGuard, PaginatedViewDto } from '../../../../core';
import {
  BlogInputDto,
  BlogsQueryParams,
  BlogViewDto,
  PostForBlogInputDto,
} from '../dto';
import { ObjectId } from 'mongodb';
import { PostQueryRepository, PostsQueryParams, PostViewDto } from '../../post';
import { BLOGS_API_PATH, POSTS_API_PATH } from '../../../../constants';
import { Types } from 'mongoose';
import { Public } from '../../../../core/decorators';

@UseGuards(BasicAuthGuard)
@Controller(BLOGS_API_PATH)
export class BlogController {
  constructor(
    private blogService: BlogService,
    private blogQueryRepository: BlogQueryRepository,
    private postQueryRepository: PostQueryRepository,
  ) {}

  @Public()
  @Get()
  async getAllBlogs(
    @Query() query: BlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const queryParams = new BlogsQueryParams(query);

    return this.blogQueryRepository.getAllBlogs(queryParams);
  }

  @Public()
  @Get(':id')
  async getBlogById(@Param('id') id: Types.ObjectId): Promise<BlogViewDto> {
    return this.blogQueryRepository.getBlogById(new ObjectId(id));
  }

  @Public()
  @Get(`:id/${POSTS_API_PATH.ROOT_URL}`)
  async getPostsForBlog(
    @Param('id') id: Types.ObjectId,
    @Query() query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryParams = new PostsQueryParams(query);
    const blogId = await this.blogService.getBlogById(id);

    return this.postQueryRepository.getPostsForBlog(blogId!, queryParams);
  }

  @Post()
  async createBlog(@Body() data: BlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.blogService.createBlog(data);

    return this.blogQueryRepository.getBlogById(blogId);
  }

  @Post(`:id/${POSTS_API_PATH.ROOT_URL}`)
  async createPostForBlog(
    @Param('id') id: Types.ObjectId,
    @Body() data: PostForBlogInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.blogService.createPostForBlog(id, data);

    return this.postQueryRepository.getPostById(postId!);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: Types.ObjectId,
    @Body() data: BlogInputDto,
  ): Promise<void> {
    return this.blogService.updateBlog(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: Types.ObjectId): Promise<void> {
    return this.blogService.deleteBlogById(id);
  }
}
