import { BlogStatusEnum } from '../../../../constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../../post';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  websiteUrl: string;

  @Column({ type: 'boolean', default: false })
  isMembership: boolean;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: BlogStatusEnum,
    enumName: 'blog_status',
    default: BlogStatusEnum.ACTIVE,
  })
  blogStatus: BlogStatusEnum;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deletedAt: Date | null;

  @OneToMany(() => Post, (post) => post.blog, { cascade: false })
  posts: Post[];
}
