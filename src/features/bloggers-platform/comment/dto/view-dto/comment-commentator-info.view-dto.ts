import { CommentatorInfo } from '../../domain/commentator-info.schema';

export class CommentCommentatorInfoViewDto {
  userId: string;
  userLogin: string;

  constructor(commentatorInfo: CommentatorInfo) {
    this.userId = commentatorInfo.userId;
    this.userLogin = commentatorInfo.userLogin;
  }
}
