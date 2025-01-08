import { BaseQueryParams } from '../../../../core/dto';
import { UsersSortBy } from '../../../../constants';

export class UsersQueryParams extends BaseQueryParams<UsersSortBy> {
  sortBy: UsersSortBy = UsersSortBy.CreatedAt;
  searchLoginTerm: string | null = null;
  searchEmailTerm: string | null = null;

  constructor(query: Partial<UsersQueryParams>) {
    super(query);
    this.sortBy = query.sortBy || UsersSortBy.CreatedAt;
    this.searchLoginTerm = query.searchLoginTerm || null;
    this.searchEmailTerm = query.searchEmailTerm || null;
  }
}
