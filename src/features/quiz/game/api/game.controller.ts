import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BearerAuthGuard, PaginatedViewDto } from '../../../../core';
import { GAME_API_PATH } from '../../../../constants';
import { CommandBus } from '@nestjs/cqrs';
import { CreateGameCommand } from '../application/use-cases/create-game.use-case';
import { GamesQueryRepository } from '../infrastructure/query/game.query-repository';
import { GameViewDto } from '../dto/view-dto/game.view-dto';
import { GetGameByIdCommand } from '../application/use-cases/get-game-by-id.use-case';
import { AnswerViewDto } from '../dto/view-dto/answer-view.dto';
import { AnswerInputDto } from '../dto/input-dto/answer.input-dto';
import { AddAnswerCommand } from '../application/use-cases/add-answer.use-case';
import { AnswerQueryRepository } from '../infrastructure/query/answer.query-repository';
import { GamesQueryParams } from '../dto/input-dto/get-all-user-games.input-dto';
import { UserStatisticViewDto } from '../dto/view-dto/user-statistic.view-dto';
import { Public } from '../../../../core/decorators';
import { GamesTopQueryParams } from '../dto/input-dto/get-games-top.input-dto';

@UseGuards(BearerAuthGuard)
@Controller(GAME_API_PATH.ROOT_URL)
export class GameController {
  constructor(
    private commandBus: CommandBus,
    private gamesQueryRepository: GamesQueryRepository,
    private answerQueryRepository: AnswerQueryRepository,
  ) {}

  @Public()
  @Get(GAME_API_PATH.TOP)
  async getGamesTop(@Query() query: GamesTopQueryParams): Promise<unknown> {
    const queryParams = new GamesTopQueryParams(query);

    return this.gamesQueryRepository.getGamesTop(queryParams);
  }

  @Get(GAME_API_PATH.MY)
  async getAllUserGames(
    @Req() req: Request & { userId: string },
    @Query() query: GamesQueryParams,
  ): Promise<PaginatedViewDto<GameViewDto[]>> {
    const queryParams = new GamesQueryParams(query);

    return this.gamesQueryRepository.findAllUserGames(req.userId, queryParams);
  }

  @Get(GAME_API_PATH.MY_STATISTIC)
  async getUserStatisticGames(
    @Req() req: Request & { userId: string },
  ): Promise<UserStatisticViewDto> {
    return this.gamesQueryRepository.getUserStatistic(req.userId);
  }

  @Get(GAME_API_PATH.MY_CURRENT)
  async getUserActiveGame(
    @Req() req: Request & { userId: string },
  ): Promise<GameViewDto> {
    return this.gamesQueryRepository.findActiveUserGame(req.userId);
  }

  @Get('pairs/:id')
  async getGameById(
    @Req() req: Request & { userId: string },
    @Param('id') id: string,
  ): Promise<GameViewDto> {
    const gameId = await this.commandBus.execute(
      new GetGameByIdCommand(req.userId, id),
    );

    return this.gamesQueryRepository.findGameById(gameId);
  }

  @Post(GAME_API_PATH.CONNECTION)
  @HttpCode(HttpStatus.OK)
  async createGame(
    @Req() req: Request & { userId: string },
  ): Promise<GameViewDto> {
    const gameId = await this.commandBus.execute(
      new CreateGameCommand(req.userId),
    );

    return this.gamesQueryRepository.findGameById(gameId);
  }

  @Post(`${GAME_API_PATH.MY_CURRENT}/${GAME_API_PATH.ANSWERS}`)
  @HttpCode(HttpStatus.OK)
  async addAnswer(
    @Req() req: Request & { userId: string },
    @Body() data: AnswerInputDto,
  ): Promise<AnswerViewDto> {
    const answerId = await this.commandBus.execute(
      new AddAnswerCommand(req.userId, data),
    );

    return this.answerQueryRepository.findAnswerById(answerId);
  }
}
