import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../../domain/game.entity';
import { Repository } from 'typeorm';
import { GameViewDto } from '../../dto/view-dto/game.view-dto';
import { GameStatusEnum } from '../../../../../constants';
import { PaginatedViewDto } from '../../../../../core';
import { GamesQueryParams } from '../../dto/input-dto/get-all-user-games.input-dto';
import { GamesSortByEnum } from '../../../../../constants/querySortBy';

@Injectable()
export class GamesQueryRepository {
  constructor(
    @InjectRepository(Game)
    private readonly gamesRepo: Repository<Game>,
  ) {}

  async findGameById(id: string): Promise<GameViewDto> {
    const game = await this.gamesRepo.findOne({
      where: { id },
      relations: {
        playerProgresses: { playerAccount: true, answers: true },
      },
    });

    if (!game) {
      throw new NotFoundException(`Game with id ${id} not found`);
    }

    return GameViewDto.mapToView(game);
  }

  async findActiveUserGame(userId: string): Promise<GameViewDto> {
    const game = await this.gamesRepo
      .createQueryBuilder('g')
      .innerJoin('g.playerProgresses', 'ppUser')
      .innerJoin('ppUser.playerAccount', 'u', 'u.id = :userId', { userId })
      .leftJoinAndSelect('g.playerProgresses', 'ppAll')
      .leftJoinAndSelect('ppAll.playerAccount', 'pa')
      .leftJoinAndSelect('ppAll.answers', 'ans')
      .where('g.status IN (:...statuses)', {
        statuses: [GameStatusEnum.ACTIVE, GameStatusEnum.PENDING_SECOND_PLAYER],
      })
      .distinct(true)
      .addOrderBy('ppAll.role', 'ASC')
      .getOne();

    if (!game) {
      throw new NotFoundException("You haven't active game");
    }

    return GameViewDto.mapToView(game);
  }

  async findAllUserGames(
    userId: string,
    query: GamesQueryParams,
  ): Promise<PaginatedViewDto<GameViewDto[]>> {
    const { sortBy, sortDirection, pageNumber, pageSize } = query;

    const dir = sortDirection.toUpperCase() as 'ASC' | 'DESC';

    const sortColumnMap: Record<GamesSortByEnum, string> = {
      [GamesSortByEnum.STATUS]: 'g.status',
      [GamesSortByEnum.PAIR_CREATED_DATE]: 'g.createdAt',
      [GamesSortByEnum.START_GAME_DATE]: 'g.startedAt',
      [GamesSortByEnum.FINISH_GAME_DATE]: 'g.finishedAt',
    };

    const primaryCol = sortColumnMap[sortBy];

    const qb = this.gamesRepo
      .createQueryBuilder('g')
      .innerJoin('g.playerProgresses', 'ppUser')
      .innerJoin('ppUser.playerAccount', 'u', 'u.id = :userId', { userId })
      .leftJoinAndSelect('g.playerProgresses', 'ppAll')
      .leftJoinAndSelect('ppAll.playerAccount', 'pa')
      .leftJoinAndSelect('ppAll.answers', 'ans')
      .distinct(true)
      .addOrderBy(primaryCol, dir, 'NULLS LAST');

    if (sortBy === GamesSortByEnum.STATUS) {
      qb.addOrderBy('g.createdAt', 'DESC', 'NULLS LAST');
    }

    qb.skip((pageNumber - 1) * pageSize).take(pageSize);

    const [items, totalCount] = await qb.getManyAndCount();

    const viewItems = items.map(GameViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items: viewItems,
      totalCount,
      page: pageNumber,
      size: pageSize,
    });
  }
}
