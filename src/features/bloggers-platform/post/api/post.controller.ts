import {
  BadRequestException,
  Body,
  Controller,
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
import { PostQueryRepository } from '../infrastructure';
import { PostsQueryParams, PostViewDto } from '../dto';
import { BearerAuthGuard, PaginatedViewDto } from '../../../../core';
import {
  CommentInputDto,
  CommentQueryRepository,
  CommentsQueryParams,
  CommentViewDto,
} from '../../comment';
import { COMMENTS_API_PATH, POSTS_API_PATH } from '../../../../constants';
import { BaseLikeStatusInputDto } from '../../../../core/dto';
import { CommandBus } from '@nestjs/cqrs';
import { GetPostByIdCommand } from '../application/use-cases/get-post-by-id.use-case';
import { CreateCommentForPostCommand } from '../application/use-cases/create-comment-for-post.use-case';
import { isUuidV4 } from '../../../../utils/uuidValidator';
import { ChangePostLikeStatusCommand } from '../application/use-cases/change-post-like-status.use-case';

@Controller(POSTS_API_PATH.ROOT_URL)
export class PostController {
  constructor(
    private commandBus: CommandBus,
    private postQueryRepository: PostQueryRepository,
    private commentsQueryRepository: CommentQueryRepository,
  ) {}

  @Get()
  async getAllPosts(
    @Req() req: Request & { userId: string },
    @Query() query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryParams = new PostsQueryParams(query);

    return this.postQueryRepository.getAllPosts(queryParams, req.userId);
  }

  @Get(':id')
  async getPostById(
    @Req() req: Request & { userId: string },
    @Param('id') id: string,
  ): Promise<PostViewDto> {
    if (!isUuidV4(id)) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'id',
            message: 'Some problem',
          },
        ],
      });
    }

    return this.postQueryRepository.getPostById(id, req.userId);
  }

  @Get(`:id/${COMMENTS_API_PATH.ROOT_URL}`)
  async getCommentsForPost(
    @Req() req: Request & { userId: string },
    @Param('id') id: string,
    @Query() query: CommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const queryParams = new CommentsQueryParams(query);

    if (!isUuidV4(id)) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'id',
            message: 'Some problem',
          },
        ],
      });
    }

    const postId = await this.commandBus.execute(new GetPostByIdCommand(id));

    return this.commentsQueryRepository.getCommentsForPost(
      postId!,
      queryParams,
      req.userId,
    );
  }

  @UseGuards(BearerAuthGuard)
  @Post(`:id/${COMMENTS_API_PATH.ROOT_URL}`)
  async createCommentForPost(
    @Req() req: Request & { userId: string },
    @Param('id') id: string,
    @Body() date: CommentInputDto,
  ): Promise<CommentViewDto> {
    if (!isUuidV4(id)) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'id',
            message: 'Some problem',
          },
        ],
      });
    }

    const commentId = await this.commandBus.execute(
      new CreateCommentForPostCommand(id, req.userId, date),
    );

    return this.commentsQueryRepository.getCommentById(commentId);
  }

  @UseGuards(BearerAuthGuard)
  @Put(`:id/${POSTS_API_PATH.LIKE_STATUS}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeLikeStatus(
    @Req() req: Request & { userId: string },
    @Param('id') id: string,
    @Body() data: BaseLikeStatusInputDto,
  ): Promise<void> {
    if (!isUuidV4(id)) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: 'id',
            message: 'Some problem',
          },
        ],
      });
    }

    return await this.commandBus.execute(
      new ChangePostLikeStatusCommand(req.userId, id, data),
    );
  }
}
