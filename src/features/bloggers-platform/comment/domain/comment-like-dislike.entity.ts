import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Comment } from './comment.entity';
import { LikeDislikeStatus } from '../../../../constants';

@Entity('comment_likes')
@Unique('uq_comment_like_user', ['commentId', 'userId'])
export class CommentLikeDislike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  commentId: string;
  @ManyToOne(() => Comment, (c) => c.commentLikesDislikes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: LikeDislikeStatus,
    enumName: 'like_status',
  })
  likeStatus: LikeDislikeStatus;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  addedAt: Date;
}
