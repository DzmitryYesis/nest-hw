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
import { PostService } from '../application';
import { PostQueryRepository } from '../infrastructure';
import { PostInputDto, PostsQueryParams, PostViewDto } from '../dto';
import {
  BasicAuthGuard,
  BearerAuthGuard,
  PaginatedViewDto,
} from '../../../../core';
import {
  CommentInputDto,
  CommentQueryRepository,
  CommentsQueryParams,
  CommentViewDto,
} from '../../comment';
import { Types } from 'mongoose';
import { COMMENTS_API_PATH, POSTS_API_PATH } from '../../../../constants';
import { BaseLikeStatusInputDto } from '../../../../core/dto';

@Controller(POSTS_API_PATH.ROOT_URL)
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

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(@Body() data: PostInputDto): Promise<PostViewDto> {
    const postId = await this.postService.createPost(data);

    return this.postQueryRepository.getPostById(postId!);
  }

  @UseGuards(BearerAuthGuard)
  @Post(`:id/${COMMENTS_API_PATH}`)
  async createCommentForPost(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
    @Body() date: CommentInputDto,
  ): Promise<CommentViewDto> {
    const commentId = await this.postService.createCommentForPost(
      id,
      req.userId,
      date,
    );

    return this.commentsQueryRepository.getCommentById(commentId);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') id: Types.ObjectId,
    @Body() data: PostInputDto,
  ): Promise<void> {
    return this.postService.updatePost(id, data);
  }

  @UseGuards(BearerAuthGuard)
  @Put(`:id/${POSTS_API_PATH.LIKE_STATUS}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeLikeStatus(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
    @Body() data: BaseLikeStatusInputDto,
  ): Promise<void> {
    return this.postService.likeStatus(req.userId, id, data);
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: Types.ObjectId): Promise<void> {
    return this.postService.deletePostById(id);
  }
}
