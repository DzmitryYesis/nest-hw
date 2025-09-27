import { CommentRowDto } from './comment-row.dto';
import { CommentLikeDislike } from '../../domain/comment-like-dislike.entity';

export class CommentWithLikesRowDto extends CommentRowDto {
  likes: CommentLikeDislike[];
  dislikes: CommentLikeDislike[];
}
