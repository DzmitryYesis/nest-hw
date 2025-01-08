import { BaseQueryParams } from '../../../../../core/dto';
import { BlogsSortBy } from '../../../../../constants';

export class BlogsQueryParams extends BaseQueryParams<BlogsSortBy> {
  sortBy: BlogsSortBy = BlogsSortBy.CREATED_AT;
  searchNameTerm: string | null = null;

  constructor(query: Partial<BlogsQueryParams>) {
    super(query);
    this.sortBy = query.sortBy || BlogsSortBy.CREATED_AT;
    this.searchNameTerm = query.searchNameTerm || null;
  }
}
