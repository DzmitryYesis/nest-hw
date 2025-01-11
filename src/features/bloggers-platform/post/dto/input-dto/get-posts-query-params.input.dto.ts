import { BaseQueryParams } from '../../../../../core';
import { PostsSortByEnum } from '../../../../../constants';

export class PostsQueryParams extends BaseQueryParams<PostsSortByEnum> {
  sortBy: PostsSortByEnum = PostsSortByEnum.CREATED_AT;

  constructor(query: Partial<PostsQueryParams>) {
    super(query);
    this.sortBy = query.sortBy || PostsSortByEnum.CREATED_AT;
  }
}
