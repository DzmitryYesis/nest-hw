import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PlayerProgress } from './player-progress.entity';
import { AnswerStatusEnum } from '../../../../constants';
import { User } from '../../../user-accounts';
import { Game } from './game.entity';

@Entity('answers')
@Index('ix_answers_user', ['userId'])
@Index('ix_answers_game', ['gameId'])
@Index('ix_answers_question', ['questionId'])
@Index('ix_answers_progress', ['playerProgress'])
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'game_id', type: 'uuid' })
  gameId: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({
    type: 'enum',
    enum: AnswerStatusEnum,
    enumName: 'answer_status',
  })
  answerStatus: AnswerStatusEnum;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Game, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @ManyToOne(() => PlayerProgress, (pp) => pp.answers, {
    onDelete: 'CASCADE',
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'player_progress_id' })
  playerProgress: PlayerProgress;
}
