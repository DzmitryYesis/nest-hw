import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Post } from './post.entity';
import { LikeDislikeStatus } from '../../../../constants';

@Entity('post_likes')
@Unique('uq_post_like_user', ['postId', 'userId'])
export class PostLikeDislike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;
  @ManyToOne(() => Post, (p) => p.postLikesDislikes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column('uuid')
  userId: string;

  @Column()
  login: string;

  @Column({
    type: 'enum',
    enum: LikeDislikeStatus,
    enumName: 'like_status',
  })
  likeStatus: LikeDislikeStatus;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  addedAt: Date;
}
