import { BaseQueryParams } from '../../../../../core';
import { CommentsSortByEnum } from '../../../../../constants';

export class CommentsQueryParams extends BaseQueryParams<CommentsSortByEnum> {
  sortBy: CommentsSortByEnum = CommentsSortByEnum.CREATED_AT;

  constructor(query: Partial<CommentsQueryParams>) {
    super(query);
    this.sortBy = query.sortBy || CommentsSortByEnum.CREATED_AT;
  }
}
