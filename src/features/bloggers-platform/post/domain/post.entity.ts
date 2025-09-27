import { PostStatusEnum } from '../../../../constants';
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
import { Blog } from '../../blog';
import { Comment } from '../../comment';
import { PostLikeDislike } from './post-like-dislike.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  shortDescription: string;

  @Column()
  content: string;

  @Column('uuid')
  blogId: string;

  @Column()
  blogName: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: PostStatusEnum,
    enumName: 'post_status',
    default: PostStatusEnum.ACTIVE,
  })
  postStatus: PostStatusEnum;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deletedAt: Date | null;

  @ManyToOne(() => Blog, (blog) => blog.posts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'blogId' })
  blog: Blog;

  @OneToMany(() => Comment, (comment) => comment.post, { cascade: false })
  comments: Comment[];

  @OneToMany(() => PostLikeDislike, (pl) => pl.post)
  postLikesDislikes: PostLikeDislike[];
}
