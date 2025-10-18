import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { Game } from '../domain/game.entity';
import { GameStatusEnum, AnswerStatusEnum } from '../../../../constants';
import { Answer } from '../domain/answer.entity';
import { PlayerProgress } from '../domain/player-progress.entity';

@Injectable()
export class GamesScheduler {
  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_SECOND)
  async sweepExpired() {
    await this.dataSource.transaction(async (m) => {
      const expired = await m
        .getRepository(Game)
        .createQueryBuilder('g')
        .setLock('pessimistic_write')
        .where('g.status = :st', { st: GameStatusEnum.ACTIVE })
        .andWhere('g.graceDeadlineAt IS NOT NULL')
        .andWhere('g.graceDeadlineAt <= NOW()')
        .select(['g.id'])
        .getMany();

      for (const g of expired) {
        const full = await m
          .getRepository(Game)
          .createQueryBuilder('g')
          .leftJoinAndSelect('g.playerProgresses', 'pp')
          .leftJoinAndSelect('pp.playerAccount', 'u')
          .leftJoinAndSelect('pp.answers', 'ans')
          .where('g.id = :id', { id: g.id })
          .getOne();
        if (!full || full.status !== GameStatusEnum.ACTIVE) continue;

        const [p1, p2] = full.playerProgresses;
        const allIds = (full.questions ?? []).map((q) => q.id);
        const have1 = new Set(p1.answers?.map((a) => a.questionId) ?? []);
        const have2 = new Set(p2.answers?.map((a) => a.questionId) ?? []);
        const miss1 = allIds.filter((id) => !have1.has(id));
        const miss2 = allIds.filter((id) => !have2.has(id));

        const aRepo = m.getRepository(Answer);
        const mk = (pp: PlayerProgress, qid: string) =>
          aRepo.create({
            userId: pp.playerAccount.id,
            gameId: full.id,
            questionId: qid,
            answerStatus: AnswerStatusEnum.INCORRECT,
            playerProgress: { id: pp.id } as any,
          });

        const toSave = [
          ...miss1.map((id) => mk(p1, id)),
          ...miss2.map((id) => mk(p2, id)),
        ];
        if (toSave.length) await aRepo.save(toSave);

        if (full.fastestPlayerProgressId) {
          const target = full.playerProgresses.find(
            (p) => p.id === full.fastestPlayerProgressId,
          );
          if (target) {
            await m
              .getRepository(PlayerProgress)
              .increment({ id: target.id }, 'score', 1);
          }
        }

        await m.getRepository(Game).update(full.id, {
          status: GameStatusEnum.FINISHED,
          finishedAt: new Date(),
          graceDeadlineAt: null,
        });
      }
    });
  }
}
