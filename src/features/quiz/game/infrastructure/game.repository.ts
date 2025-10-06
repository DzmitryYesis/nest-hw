import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../domain/game.entity';
import { Repository } from 'typeorm';
import {
  GameStatusEnum,
  PlayerRoleEnum,
  QuestionStatusEnum,
} from '../../../../constants';
import { User } from '../../../user-accounts';
import { PlayerProgress } from '../domain/player-progress.entity';
import { Question } from '../../question/domain/question.entity';
import { UpdatePlayerProgressDto } from '../dto/domain-dto/update-player-progress.dto';

@Injectable()
export class GamesRepository {
  constructor(
    @InjectRepository(Game)
    private readonly gamesRepo: Repository<Game>,
    @InjectRepository(PlayerProgress)
    private readonly playerProgressRepo: Repository<PlayerProgress>,
    @InjectRepository(Question)
    private readonly questionsRepo: Repository<Question>,
  ) {}

  async findGameById(id: string): Promise<Game | null> {
    return await this.gamesRepo.findOne({
      where: { id },
      relations: { playerProgresses: { playerAccount: true } },
    });
  }

  async findUserOpenGame(userId: string): Promise<Game | null> {
    return this.gamesRepo
      .createQueryBuilder('g')
      .innerJoin('g.playerProgresses', 'pp')
      .innerJoin('pp.playerAccount', 'u')
      .where('u.id = :userId', { userId })
      .andWhere('g.status IN (:...statuses)', {
        statuses: [GameStatusEnum.ACTIVE, GameStatusEnum.PENDING_SECOND_PLAYER],
      })
      .getOne();
  }

  async findUserActiveGame(userId: string): Promise<Game | null> {
    return this.gamesRepo
      .createQueryBuilder('g')
      .innerJoin('g.playerProgresses', 'ppUser')
      .innerJoin('ppUser.playerAccount', 'u', 'u.id = :userId', { userId })
      .leftJoinAndSelect('g.playerProgresses', 'ppAll')
      .leftJoinAndSelect('ppAll.playerAccount', 'pa')
      .leftJoinAndSelect('ppAll.answers', 'ans')
      .andWhere('g.status = :status', {
        status: GameStatusEnum.ACTIVE,
      })
      .distinct(true)
      .addOrderBy('ppAll.role', 'ASC')
      .getOne();
  }

  async findPendingGame(): Promise<Game | null> {
    return await this.gamesRepo.findOne({
      where: { status: GameStatusEnum.PENDING_SECOND_PLAYER },
      relations: { playerProgresses: { playerAccount: true } },
    });
  }

  async createPendingGame(user: User): Promise<string> {
    const newGame = this.gamesRepo.create();
    await this.gamesRepo.save(newGame);

    const first = this.playerProgressRepo.create({
      playerAccount: user,
      game: newGame,
      role: PlayerRoleEnum.FIRST,
    });
    await this.playerProgressRepo.save(first);

    return newGame.id;
  }

  async connectToGame(game: Game, user: User): Promise<string> {
    const second = this.playerProgressRepo.create({
      playerAccount: user,
      game: game,
      role: PlayerRoleEnum.SECOND,
    });
    await this.playerProgressRepo.save(second);

    const questions = await this.questionsRepo
      .createQueryBuilder('q')
      .where('q.published = :pub', { pub: true })
      .andWhere('q.questionStatus = :qs', { qs: QuestionStatusEnum.ACTIVE })
      .orderBy('RANDOM()')
      .limit(5)
      .getMany();

    if (questions.length < 5) {
      throw new Error('Sorry, we have no 5 active published question.');
    }

    const snapshots = questions.map((q) => ({
      id: q.id,
      body: q.body,
      correctAnswers: q.correctAnswers,
    }));

    await this.gamesRepo.update(game.id, {
      status: GameStatusEnum.ACTIVE,
      startedAt: new Date(),
      questions: snapshots,
    });

    return game.id;
  }

  async updatePlayerProgress(
    id: string,
    dto: UpdatePlayerProgressDto,
  ): Promise<void> {
    const { score, indexOfActiveQuestion } = dto;

    await this.playerProgressRepo.update(
      { id },
      { score, indexOfActiveQuestion },
    );
  }

  async finishGame(gameId: string): Promise<void> {
    await this.gamesRepo.update(
      { id: gameId },
      { status: GameStatusEnum.FINISHED, finishedAt: new Date() },
    );
  }
}
