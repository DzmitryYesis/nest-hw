import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../user-accounts';
import { Game } from './game.entity';
import { PlayerRoleEnum } from '../../../../constants';
import { Answer } from './answer.entity';

@Entity('player_progress')
export class PlayerProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'player_account_id' })
  playerAccount: User;

  @ManyToOne(() => Game, (g) => g.playerProgresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({
    type: 'enum',
    enum: PlayerRoleEnum,
    enumName: 'player_role',
  })
  role: PlayerRoleEnum;

  @Column({ type: 'int', default: 0 })
  indexOfActiveQuestion: number;

  @OneToMany(() => Answer, (a) => a.playerProgress, {
    cascade: false,
    eager: false,
  })
  answers: Answer[];

  @Column({ type: 'int', default: 0 })
  score: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
