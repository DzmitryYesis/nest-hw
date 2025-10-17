import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionStatusEnum } from '../../../../constants';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ collation: 'C' })
  body: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  correctAnswers: string[];

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  updatedAt: Date | null;

  @Column({
    type: 'enum',
    enum: QuestionStatusEnum,
    enumName: 'question_status',
    default: QuestionStatusEnum.ACTIVE,
  })
  questionStatus: QuestionStatusEnum;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deletedAt: Date | null;
}
