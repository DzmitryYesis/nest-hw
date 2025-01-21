import { Controller, Get, Param } from '@nestjs/common';
import { CommentQueryRepository } from '../infrastructure';
import { CommentViewDto } from '../dto';
import { Types } from 'mongoose';

@Controller('comments')
export class CommentController {
  constructor(private commentQueryRepository: CommentQueryRepository) {}

  @Get(':id')
  async getCommentById(
    @Param('id') id: Types.ObjectId,
  ): Promise<CommentViewDto> {
    return this.commentQueryRepository.getCommentById(id);
  }
}
