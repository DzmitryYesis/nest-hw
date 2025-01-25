import { Injectable } from '@nestjs/common';
import { CommentDocument } from '../domain';

@Injectable()
export class CommentRepository {
  async save(comment: CommentDocument): Promise<void> {
    await comment.save();
  }
}
