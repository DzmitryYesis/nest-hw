import { BaseQueryParams } from '../../../../../core';
import { CommentsSortBy } from '../../../../../constants';

export class CommentsQueryParams extends BaseQueryParams<CommentsSortBy> {
  sortBy: CommentsSortBy = CommentsSortBy.CREATED_AT;

  constructor(query: Partial<CommentsQueryParams>) {
    super(query);
    this.sortBy = query.sortBy || CommentsSortBy.CREATED_AT;
  }
}
