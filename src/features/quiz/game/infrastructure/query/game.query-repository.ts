import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../../domain/game.entity';
import { Repository } from 'typeorm';
import { GameViewDto } from '../../dto/view-dto/game.view-dto';
import { GameStatusEnum } from '../../../../../constants';
import { PaginatedViewDto } from '../../../../../core';
import { GamesQueryParams } from '../../dto/input-dto/get-all-user-games.input-dto';
import { GamesSortByEnum } from '../../../../../constants/querySortBy';
import { UserStatisticViewDto } from '../../dto/view-dto/user-statistic.view-dto';
import { PlayerProgress } from '../../domain/player-progress.entity';

@Injectable()
export class GamesQueryRepository {
  constructor(
    @InjectRepository(Game)
    private readonly gamesRepo: Repository<Game>,
    @InjectRepository(PlayerProgress)
    private readonly playerProgressRepo: Repository<PlayerProgress>,
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

  async getUserStatistic(userId: string): Promise<UserStatisticViewDto> {
    const raw = await this.playerProgressRepo
      .createQueryBuilder('pp')
      .select([
        `COUNT(*)::int AS "gamesCount"`,
        `COALESCE(SUM(pp.score),0)::int AS "sumScore"`,
        `COALESCE(ROUND(AVG(pp.score)::numeric, 2), 0)::float AS "avgScores"`,
        `COALESCE(SUM(CASE WHEN pp.score > opp.score THEN 1 ELSE 0 END),0)::int AS "winsCount"`,
        `COALESCE(SUM(CASE WHEN pp.score < opp.score THEN 1 ELSE 0 END),0)::int AS "lossesCount"`,
        `COALESCE(SUM(CASE WHEN pp.score = opp.score THEN 1 ELSE 0 END),0)::int AS "drawsCount"`,
      ])
      .innerJoin('pp.game', 'g')
      .innerJoin(
        'player_progress',
        'opp',
        'opp.game_id = pp.game_id AND opp.id <> pp.id',
      )
      .where('pp.player_account_id = :userId', { userId })
      .andWhere('g.status = :finished', { finished: GameStatusEnum.FINISHED })
      .getRawOne<UserStatisticViewDto>();

    return (
      raw ?? {
        gamesCount: 0,
        sumScore: 0,
        avgScores: 0,
        winsCount: 0,
        lossesCount: 0,
        drawsCount: 0,
      }
    );
  }
}
