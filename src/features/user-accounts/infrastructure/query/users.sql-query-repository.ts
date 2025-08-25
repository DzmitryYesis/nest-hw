import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserInfoViewDto, UsersQueryParams, UserViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../core';

@Injectable()
export class UsersSqlQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async getAllUsers(
    query: UsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      searchEmailTerm,
      searchLoginTerm,
    } = query;

    const sortMap: Record<string, string> = {
      login: '"login" COLLATE "C"',
      email: '"email" COLLATE "C"',
      userStatus: '"userStatus"',
      createdAt: '"createdAt"',
    };
    const orderBy = sortMap[sortBy];
    const direction = sortDirection.toUpperCase();

    const where: string[] = ['"userStatus" <> $1', '"deletedAt" IS NULL'];
    const params: any[] = ['DELETED'];
    let i = 2;

    const orParts: string[] = [];
    if (searchEmailTerm) {
      orParts.push(`"email" ILIKE $${i}`);
      params.push(`%${searchEmailTerm}%`);
      i++;
    }
    if (searchLoginTerm) {
      orParts.push(`"login" ILIKE $${i}`);
      params.push(`%${searchLoginTerm}%`);
      i++;
    }
    if (orParts.length) where.push(`(${orParts.join(' OR ')})`);

    const sql = `
    SELECT
      *,
      COUNT(*) OVER()::int AS total_count
    FROM public."Users"
    WHERE ${where.join(' AND ')}
    ORDER BY ${orderBy} ${direction}
    LIMIT $${i} OFFSET $${i + 1};
  `;
    params.push(pageSize, (pageNumber - 1) * pageSize);

    const rows = await this.dataSource.query(sql, params);

    const totalCount = rows[0]?.total_count ?? 0;
    const items = rows.map(UserViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }

  async getUserById(id: string): Promise<UserViewDto> {
    const res = await this.dataSource.query(
      'SELECT * FROM public."Users" WHERE "id" = $1::uuid',
      [id],
    );

    if (res.length === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return UserViewDto.mapToView(res[0]);
  }

  async getUserInfoById(id: string): Promise<UserInfoViewDto> {
    const res = await this.dataSource.query(
      'SELECT * FROM public."Users" WHERE "id" = $1::uuid',
      [id],
    );

    if (res.length === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return UserInfoViewDto.mapToView(res[0]);
  }
}
