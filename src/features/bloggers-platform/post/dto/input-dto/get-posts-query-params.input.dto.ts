import { BaseQueryParams } from '../../../../../core';
import { PostsSortBy } from '../../../../../constants';

export class PostsQueryParams extends BaseQueryParams<PostsSortBy> {
  sortBy: PostsSortBy = PostsSortBy.CREATED_AT;

  constructor(query: Partial<PostsQueryParams>) {
    super(query);
    this.sortBy = query.sortBy || PostsSortBy.CREATED_AT;
  }
}
