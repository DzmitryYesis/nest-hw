import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from '../domain/game.entity';
import { EntityManager, Repository } from 'typeorm';
import {
  AnswerStatusEnum,
  GameStatusEnum,
  PlayerRoleEnum,
  QuestionStatusEnum,
} from '../../../../constants';
import { User } from '../../../user-accounts';
import { PlayerProgress } from '../domain/player-progress.entity';
import { Question } from '../../question/domain/question.entity';
import { UpdatePlayerProgressDto } from '../dto/domain-dto/update-player-progress.dto';
import { Answer } from '../domain/answer.entity';

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

  async findUserActiveGameForUpdate(
    userId: string,
    m: EntityManager,
  ): Promise<Game | null> {
    const locked = await m
      .getRepository(Game)
      .createQueryBuilder('g')
      .setLock('pessimistic_write')
      .innerJoin('g.playerProgresses', 'ppUser')
      .innerJoin('ppUser.playerAccount', 'u', 'u.id = :userId', { userId })
      .where('g.status = :st', { st: GameStatusEnum.ACTIVE })
      .select(['g.id'])
      .getOne();

    if (!locked) return null;

    return m
      .getRepository(Game)
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.playerProgresses', 'ppAll')
      .leftJoinAndSelect('ppAll.playerAccount', 'pa')
      .leftJoinAndSelect('ppAll.answers', 'ans')
      .where('g.id = :id', { id: locked.id })
      .addOrderBy('ppAll.role', 'ASC')
      .addOrderBy('ans.createdAt', 'ASC')
      .getOne();
  }

  async updatePlayerProgressTx(
    m: EntityManager,
    id: string,
    dto: UpdatePlayerProgressDto,
  ) {
    await m.getRepository(PlayerProgress).update({ id }, dto);
  }

  async setGraceDeadlineTx(
    gameId: string,
    deadline: Date | null,
    m: EntityManager,
  ) {
    await m.getRepository(Game).update(gameId, { graceDeadlineAt: deadline });
  }

  async finishGameTx(m: EntityManager, gameId: string) {
    await m.getRepository(Game).update(
      { id: gameId },
      {
        status: GameStatusEnum.FINISHED,
        finishedAt: new Date(),
        graceDeadlineAt: null,
      },
    );
  }

  async createAnswerTx(
    m: EntityManager,
    payload: {
      userId: string;
      gameId: string;
      questionId: string;
      answerStatus: AnswerStatusEnum;
      playerProgress: PlayerProgress;
    },
  ): Promise<string> {
    const repo = m.getRepository(Answer);
    const entity = repo.create({
      userId: payload.userId,
      gameId: payload.gameId,
      questionId: payload.questionId,
      answerStatus: payload.answerStatus,
      playerProgress: { id: payload.playerProgress.id } as any,
    });
    const saved = await repo.save(entity);
    return saved.id;
  }

  async finalizeWithAutoFillTx(game: Game, m: EntityManager) {
    const gRepo = m.getRepository(Game);
    const aRepo = m.getRepository(Answer);

    const [p1, p2] = game.playerProgresses;
    const allIds = (game.questions ?? []).map((q) => q.id);

    const ans1 = new Set(p1.answers?.map((a) => a.questionId) ?? []);
    const ans2 = new Set(p2.answers?.map((a) => a.questionId) ?? []);

    const miss1 = allIds.filter((id) => !ans1.has(id));
    const miss2 = allIds.filter((id) => !ans2.has(id));

    const mk = (pp: PlayerProgress, qid: string) =>
      aRepo.create({
        userId: pp.playerAccount.id,
        gameId: game.id,
        questionId: qid,
        answerStatus: AnswerStatusEnum.INCORRECT,
        playerProgress: { id: pp.id } as any,
      });

    const toSave = [
      ...miss1.map((id) => mk(p1, id)),
      ...miss2.map((id) => mk(p2, id)),
    ];
    if (toSave.length) await aRepo.save(toSave);

    await gRepo.update(game.id, {
      status: GameStatusEnum.FINISHED,
      finishedAt: new Date(),
      graceDeadlineAt: null,
    });
  }

  async reloadGameWithLockAndFinalizeIfNeeded(
    gameId: string,
    m: EntityManager,
  ) {
    const game = await m
      .getRepository(Game)
      .createQueryBuilder('g')
      .setLock('pessimistic_write')
      .leftJoinAndSelect('g.playerProgresses', 'pp')
      .leftJoinAndSelect('pp.playerAccount', 'u')
      .leftJoinAndSelect('pp.answers', 'ans')
      .where('g.id = :id', { id: gameId })
      .getOne();

    if (!game) return;
    if (game.status !== GameStatusEnum.ACTIVE) return;
    if (!game.graceDeadlineAt || new Date() <= game.graceDeadlineAt) return;

    await this.finalizeWithAutoFillTx(game, m);
  }

  async markFastestTx(gameId: string, progressId: string, m: EntityManager) {
    await m
      .getRepository(Game)
      .update(gameId, { fastestPlayerProgressId: progressId });
  }

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
