import { CommentCommentatorInfoViewDto } from './comment-commentator-info.view-dto';
import { CommentsLikesDislikesInfoViewDto } from './comments-likes-dislikes-info.view-dto';
import { CommentWithLikesRowDto } from '../input-dto/comment-with-likes-row.dto';

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentCommentatorInfoViewDto;
  createdAt: Date;
  likesInfo: CommentsLikesDislikesInfoViewDto;

  static mapToView(
    comment: CommentWithLikesRowDto,
    userId?: string,
  ): CommentViewDto {
    const dto = new CommentViewDto();

    dto.id = comment.id;
    dto.content = comment.content;
    dto.createdAt = new Date(comment.createdAt);

    dto.commentatorInfo = new CommentCommentatorInfoViewDto({
      userId: comment.userId,
      userLogin: comment.userLogin,
    });

    dto.likesInfo = new CommentsLikesDislikesInfoViewDto(
      comment.likes,
      comment.dislikes,
      userId,
    );

    return dto;
  }
}
