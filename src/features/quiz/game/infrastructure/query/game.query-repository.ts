import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Game } from '../../domain/game.entity';
import { DataSource, Repository } from 'typeorm';
import { GameViewDto } from '../../dto/view-dto/game.view-dto';
import { GameStatusEnum } from '../../../../../constants';
import { PaginatedViewDto } from '../../../../../core';
import { GamesQueryParams } from '../../dto/input-dto/get-all-user-games.input-dto';
import { GamesSortByEnum } from '../../../../../constants/querySortBy';
import { UserStatisticViewDto } from '../../dto/view-dto/user-statistic.view-dto';
import { PlayerProgress } from '../../domain/player-progress.entity';
import { GamesTopQueryParams } from '../../dto/input-dto/get-games-top.input-dto';

export type TopUsersItem = {
  sumScore: number;
  avgScores: number;
  gamesCount: number;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
  player: { id: string; login: string };
};

@Injectable()
export class GamesQueryRepository {
  constructor(
    @InjectDataSource()
    protected dataSource: DataSource,
    @InjectRepository(Game)
    private readonly gamesRepo: Repository<Game>,
    @InjectRepository(PlayerProgress)
    private readonly playerProgressRepo: Repository<PlayerProgress>,
  ) {}

  async getGamesTop(query: GamesTopQueryParams) {
    const page = Math.max(1, query.pageNumber);
    const pageSize = Math.min(50, Math.max(1, query.pageSize));

    const SORT_COLUMNS: Record<string, string> = {
      avgScores: 'avgScores',
      sumScore: 'sumScore',
      winsCount: 'winsCount',
      lossesCount: 'lossesCount',
      drawsCount: 'drawsCount',
      gamesCount: 'gamesCount',
    };

    const parsedSorts = query.sort
      .map((s) => s.trim())
      .map((s) => {
        const [fieldRaw, dirRaw] = s.split(/\s+/, 2);
        const field = fieldRaw as keyof typeof SORT_COLUMNS;
        const dir = (dirRaw?.toLowerCase() === 'asc' ? 'ASC' : 'DESC') as
          | 'ASC'
          | 'DESC';
        return [field, dir] as const;
      })
      .filter(([field]) => SORT_COLUMNS[field]);

    const base = this.playerProgressRepo
      .createQueryBuilder('pp')
      .innerJoin('pp.game', 'g')
      .innerJoin('pp.playerAccount', 'u')
      .innerJoin(
        'player_progress',
        'opp',
        'opp.game_id = pp.game_id AND opp.id <> pp.id',
      )
      .where('g.status = :finished', { finished: GameStatusEnum.FINISHED })
      .groupBy('pp.player_account_id')
      .addGroupBy('u.login')
      .select([
        `pp.player_account_id                                AS "playerId"`,
        `u.login                                             AS "login"`,
        `COUNT(*)::int                                       AS "gamesCount"`,
        `COALESCE(SUM(pp.score),0)::int                      AS "sumScore"`,
        `COALESCE(ROUND(AVG(pp.score)::numeric,2),0)::float  AS "avgScores"`,
        `COALESCE(SUM(CASE WHEN pp.score >  opp.score THEN 1 ELSE 0 END),0)::int AS "winsCount"`,
        `COALESCE(SUM(CASE WHEN pp.score <  opp.score THEN 1 ELSE 0 END),0)::int AS "lossesCount"`,
        `COALESCE(SUM(CASE WHEN pp.score =  opp.score THEN 1 ELSE 0 END),0)::int AS "drawsCount"`,
      ]);

    const sub = this.dataSource
      .createQueryBuilder()
      .from('(' + base.getQuery() + ')', 's')
      .setParameters(base.getParameters())
      .select([
        `"s"."gamesCount"  AS "gamesCount"`,
        `"s"."sumScore"    AS "sumScore"`,
        `"s"."avgScores"   AS "avgScores"`,
        `"s"."winsCount"   AS "winsCount"`,
        `"s"."lossesCount" AS "lossesCount"`,
        `"s"."drawsCount"  AS "drawsCount"`,
        `"s"."playerId"    AS "playerId"`,
        `"s"."login"       AS "login"`,
      ]);

    for (const [field, dir] of parsedSorts) {
      sub.addOrderBy(`"s"."${SORT_COLUMNS[field]}"`, dir, 'NULLS LAST');
    }

    sub.addOrderBy(`"s"."login"`, 'ASC').addOrderBy(`"s"."playerId"`, 'ASC');

    sub.offset((page - 1) * pageSize).limit(pageSize);

    const totalQb = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'cnt')
      .from('(' + base.getQuery() + ')', 't')
      .setParameters(base.getParameters());

    const [rows, totalRaw] = await Promise.all([
      sub.getRawMany<{
        gamesCount: string | number;
        sumScore: string | number;
        avgScores: string | number;
        winsCount: string | number;
        lossesCount: string | number;
        drawsCount: string | number;
        playerId: string;
        login: string;
      }>(),
      totalQb.getRawOne<{ cnt: string }>(),
    ]);

    const totalCount = Number(totalRaw?.cnt ?? 0);

    const items: TopUsersItem[] = rows.map((r) => ({
      gamesCount: Number(r.gamesCount),
      sumScore: Number(r.sumScore),
      avgScores: Number(r.avgScores),
      winsCount: Number(r.winsCount),
      lossesCount: Number(r.lossesCount),
      drawsCount: Number(r.drawsCount),
      player: { id: r.playerId, login: r.login },
    }));

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page,
      pageSize,
      totalCount,
      items,
    };
  }

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
