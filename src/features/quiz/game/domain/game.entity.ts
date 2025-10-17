import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GameStatusEnum } from '../../../../constants';
import { GameQuestionSnapshot } from '../dto/domain-dto/game-question.dto';
import { PlayerProgress } from './player-progress.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => PlayerProgress, (pp) => pp.game, {
    cascade: true,
    eager: true,
  })
  playerProgresses: PlayerProgress[];

  @Column({ type: 'jsonb', nullable: true, default: null })
  questions: GameQuestionSnapshot[] | null;

  @Column({
    type: 'enum',
    enum: GameStatusEnum,
    enumName: 'game_status',
    default: GameStatusEnum.PENDING_SECOND_PLAYER,
  })
  status: GameStatusEnum;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  finishedAt: Date | null;

  get firstPlayerProgress(): PlayerProgress | undefined {
    return this.playerProgresses?.find((p) => p.role === 'FIRST');
  }

  get secondPlayerProgress(): PlayerProgress | undefined {
    return this.playerProgresses?.find((p) => p.role === 'SECOND');
  }

  answeringPlayerProgress(userId: string): PlayerProgress | undefined {
    return this.playerProgresses?.find((p) => p.playerAccount.id === userId);
  }

  rivalPlayerProgress(userId: string): PlayerProgress | undefined {
    return this.playerProgresses?.find((p) => p.playerAccount.id !== userId);
  }
}
