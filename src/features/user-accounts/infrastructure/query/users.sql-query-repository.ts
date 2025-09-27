import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Not, Repository } from 'typeorm';
import { UserInfoViewDto, UsersQueryParams, UserViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../core';
import { User } from '../../domain';
import { UserStatusEnum } from '../../../../constants';

@Injectable()
export class UsersSqlQueryRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

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

    const qb = this.usersRepo
      .createQueryBuilder('u')
      .where('u.userStatus <> :deleted', { deleted: UserStatusEnum.DELETED })
      .andWhere('u.deletedAt IS NULL');

    if (searchEmailTerm || searchLoginTerm) {
      qb.andWhere(
        new Brackets((qb2) => {
          if (searchEmailTerm) {
            qb2.orWhere('u.email ILIKE :email', {
              email: `%${searchEmailTerm}%`,
            });
          }
          if (searchLoginTerm) {
            qb2.orWhere('u.login ILIKE :login', {
              login: `%${searchLoginTerm}%`,
            });
          }
        }),
      );
    }

    const dir = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const sortMap: Record<string, string> = {
      login: `"u"."login" COLLATE "C"`,
      email: `"u"."email" COLLATE "C"`,
      userStatus: 'u.userStatus',
      createdAt: 'u.createdAt',
    };
    qb.orderBy(sortMap[sortBy] ?? 'u.createdAt', dir as 'ASC' | 'DESC');

    qb.skip((pageNumber - 1) * pageSize).take(pageSize);

    const [items, totalCount] = await qb.getManyAndCount();
    const viewItems = items.map(UserViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items: viewItems,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }

  async getUserById(id: string): Promise<UserViewDto> {
    const user = await this.usersRepo.findOne({
      where: {
        id,
        userStatus: Not(UserStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return UserViewDto.mapToView(user);
  }

  async getUserInfoById(id: string): Promise<UserInfoViewDto> {
    const user = await this.usersRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return UserInfoViewDto.mapToView(user);
  }
}
