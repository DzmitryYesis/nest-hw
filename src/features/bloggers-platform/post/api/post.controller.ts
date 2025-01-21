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
import { PostService } from '../application';
import { PostQueryRepository } from '../infrastructure';
import { PostInputDto, PostsQueryParams, PostViewDto } from '../dto';
import { PaginatedViewDto } from '../../../../core';
import {
  CommentQueryRepository,
  CommentsQueryParams,
  CommentViewDto,
} from '../../comment';
import { Types } from 'mongoose';
import { COMMENTS_API_PATH, POSTS_API_PATH } from '../../../../constants';

@Controller(POSTS_API_PATH)
export class PostController {
  constructor(
    private postService: PostService,
    private postQueryRepository: PostQueryRepository,
    private commentsQueryRepository: CommentQueryRepository,
  ) {}

  @Get()
  async getAllPosts(
    @Query() query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryParams = new PostsQueryParams(query);

    return this.postQueryRepository.getAllPosts(queryParams);
  }

  @Get(':id')
  async getPostById(@Param('id') id: Types.ObjectId): Promise<PostViewDto> {
    return this.postQueryRepository.getPostById(id);
  }

  @Get(`:id/${COMMENTS_API_PATH}`)
  async getCommentsForPost(
    @Param('id') id: Types.ObjectId,
    @Query() query: CommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const queryParams = new CommentsQueryParams(query);
    const postId = await this.postService.getPostById(id);

    return this.commentsQueryRepository.getCommentsForPost(
      postId!,
      queryParams,
    );
  }

  @Post()
  async createPost(@Body() data: PostInputDto): Promise<PostViewDto> {
    const postId = await this.postService.createPost(data);

    return this.postQueryRepository.getPostById(postId!);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') id: Types.ObjectId,
    @Body() data: PostInputDto,
  ): Promise<void> {
    return this.postService.updatePost(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: Types.ObjectId): Promise<void> {
    return this.postService.deletePostById(id);
  }
}
