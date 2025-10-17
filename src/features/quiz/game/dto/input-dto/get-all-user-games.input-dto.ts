import { BaseQueryParams } from '../../../../../core';
import { Optional } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { GamesSortByEnum } from '../../../../../constants/querySortBy';

export class GamesQueryParams extends BaseQueryParams<GamesSortByEnum> {
  @Optional()
  @IsEnum(GamesSortByEnum)
  sortBy: GamesSortByEnum = GamesSortByEnum.PAIR_CREATED_DATE;

  constructor(query: Partial<GamesQueryParams> = {}) {
    super(query);
    this.sortBy = query.sortBy ?? GamesSortByEnum.PAIR_CREATED_DATE;
  }
}
