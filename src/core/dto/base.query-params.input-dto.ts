import { SortDirection } from '../../constants';

export abstract class BaseQueryParams<T> {
  sortDirection: SortDirection = SortDirection.DESC;
  pageNumber: number = 1;
  pageSize: number = 10;
  abstract sortBy: T;

  protected constructor(query: Partial<BaseQueryParams<T>>) {
    this.sortDirection = query.sortDirection || SortDirection.DESC;
    this.pageNumber = query.pageNumber ? Number(query.pageNumber) : 1;
    this.pageSize = query.pageSize ? Number(query.pageSize) : 10;
  }
}
