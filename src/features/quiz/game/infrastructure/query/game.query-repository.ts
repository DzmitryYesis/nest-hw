import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../../domain/game.entity';
import { Repository } from 'typeorm';
import { GameViewDto } from '../../dto/view-dto/game.view-dto';
import { GameStatusEnum } from '../../../../../constants';

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
}
