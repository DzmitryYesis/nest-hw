import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class GamesTopQueryParams {
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : [],
  )
  sort: string[] = ['avgScores desc', 'sumScore desc'];

  @IsInt({ message: 'pageSize must be an integer' })
  @IsPositive({ message: 'pageSize must be greater than 0' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  pageNumber: number = 1;

  @IsInt({ message: 'pageSize must be an integer' })
  @IsPositive({ message: 'pageSize must be greater than 0' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  pageSize: number = 10;

  constructor(query: Partial<GamesTopQueryParams> = {}) {
    this.sort = query.sort ?? ['avgScores desc', 'sumScore desc'];
    this.pageNumber = query.pageNumber ? Number(query.pageNumber) : 1;
    this.pageSize = query.pageSize ? Number(query.pageSize) : 10;
  }
}
