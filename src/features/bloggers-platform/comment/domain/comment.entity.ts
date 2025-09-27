import { CommentStatusEnum } from '../../../../constants';
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
import { Post } from '../../post';
import { CommentLikeDislike } from './comment-like-dislike.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column('uuid')
  postId: string;

  @Column('uuid')
  userId: string;

  @Column()
  userLogin: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: CommentStatusEnum,
    enumName: 'comment_status',
    default: CommentStatusEnum.ACTIVE,
  })
  commentStatus: CommentStatusEnum;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deletedAt: Date | null;

  @ManyToOne(() => Post, (post) => post.comments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @OneToMany(() => CommentLikeDislike, (cl) => cl.comment)
  commentLikesDislikes: CommentLikeDislike[];
}
