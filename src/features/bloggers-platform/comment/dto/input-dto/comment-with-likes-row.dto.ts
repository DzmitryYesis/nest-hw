import { CommentRowDto } from './comment-row.dto';
import { BaseLikesDislikesDBData } from '../../../../../core';

export class CommentWithLikesRowDto extends CommentRowDto {
  likes: BaseLikesDislikesDBData[];
  dislikes: BaseLikesDislikesDBData[];
}
