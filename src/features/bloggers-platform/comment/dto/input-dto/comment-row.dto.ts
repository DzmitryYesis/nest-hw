import { CommentLikeDislike } from '../../domain/comment-like-dislike.entity';

export class CommentRowDto {
  id: string;
  postId: string;
  content: string;
  userId: string;
  userLogin: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  commentStatus: string;
  likes: CommentLikeDislike[];
  dislikes: CommentLikeDislike[];
}
