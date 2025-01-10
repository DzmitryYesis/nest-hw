import { Controller, Get, Param } from '@nestjs/common';
import { CommentQueryRepository } from '../infrastructure';
import { ObjectId } from 'mongodb';
import { CommentViewDto } from '../dto';

@Controller('comments')
export class CommentController {
  constructor(private commentQueryRepository: CommentQueryRepository) {}

  @Get(':id')
  async getCommentById(@Param('id') id: string): Promise<CommentViewDto> {
    return this.commentQueryRepository.getCommentById(new ObjectId(id));
  }
}
