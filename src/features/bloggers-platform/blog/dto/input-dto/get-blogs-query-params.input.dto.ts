import { BaseQueryParams } from '../../../../../core';
import { BlogsSortByEnum } from '../../../../../constants';

export class BlogsQueryParams extends BaseQueryParams<BlogsSortByEnum> {
  sortBy: BlogsSortByEnum = BlogsSortByEnum.CREATED_AT;
  searchNameTerm: string | null = null;

  constructor(query: Partial<BlogsQueryParams>) {
    super(query);
    this.sortBy = query.sortBy || BlogsSortByEnum.CREATED_AT;
    this.searchNameTerm = query.searchNameTerm || null;
  }
}
