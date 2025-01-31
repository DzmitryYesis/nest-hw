import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentQueryRepository } from '../infrastructure';
import { CommentInputDto, CommentViewDto } from '../dto';
import { Types } from 'mongoose';
import { BearerAuthGuard } from '../../../../core';
import { Public } from '../../../../core/decorators';
import { COMMENTS_API_PATH } from '../../../../constants';
import { CommentService } from '../application';
import { BaseLikeStatusInputDto } from '../../../../core/dto';

@UseGuards(BearerAuthGuard)
@Controller(COMMENTS_API_PATH.ROOT_URL)
export class CommentController {
  constructor(
    private commentService: CommentService,
    private commentQueryRepository: CommentQueryRepository,
  ) {}

  @Public()
  @Get(':id')
  async getCommentById(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
  ): Promise<CommentViewDto> {
    return this.commentQueryRepository.getCommentById(id, req.userId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateComment(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
    @Body() data: CommentInputDto,
  ): Promise<void> {
    return this.commentService.updateComment(id, data, req.userId);
  }

  @Put(`:id/${COMMENTS_API_PATH.LIKE_STATUS}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeLikeStatus(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
    @Body() data: BaseLikeStatusInputDto,
  ): Promise<void> {
    return this.commentService.likeStatus(req.userId, id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
  ): Promise<void> {
    return this.commentService.deleteComment(id, req.userId);
  }
}
