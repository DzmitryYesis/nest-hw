import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { LikeDislikeForPostDto } from '../dto/application/like-deslike-for-post.dto';
import { Post } from '../domain';
import { LikeDislikeStatus, PostStatusEnum } from '../../../../constants';
import { PostLikeDislike } from '../domain/post-like-dislike.entity';

@Injectable()
export class PostRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,
    @InjectRepository(PostLikeDislike)
    private readonly postLikeDislikeRepo: Repository<PostLikeDislike>,
  ) {}

  async findPostById(id: string): Promise<Post | null> {
    const post = await this.postsRepo.findOne({
      where: {
        id,
        postStatus: Not(PostStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
      relations: {
        postLikesDislikes: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    return post;
  }

  async findLikeDislike(
    postId: string,
    userId: string,
  ): Promise<PostLikeDislike | null> {
    return await this.postLikeDislikeRepo.findOne({
      where: {
        postId,
        userId,
      },
    });
  }

  async createPostForBlog(
    title: string,
    content: string,
    shortDescription: string,
    blogId: string,
    blogName: string,
  ): Promise<string> {
    const post = this.postsRepo.create({
      title,
      content,
      shortDescription,
      blogId,
      blogName,
    });

    await this.postsRepo.save(post);

    return post.id;
  }

  async createLikeDislike(dto: LikeDislikeForPostDto): Promise<void> {
    const { postId, userId, login, likeStatus } = dto;
    const likeDislike = this.postLikeDislikeRepo.create({
      postId,
      userId,
      login,
      likeStatus: likeStatus as LikeDislikeStatus,
    });

    await this.postLikeDislikeRepo.save(likeDislike);
  }

  async updatePost(
    title: string,
    content: string,
    shortDescription: string,
    postId: string,
  ): Promise<void> {
    await this.postsRepo.update(
      { id: postId },
      { title, content, shortDescription },
    );
  }

  async updateLikeDislikeStatus(
    postLikeDislike: PostLikeDislike,
    likeStatus: LikeDislikeStatus,
  ): Promise<void> {
    postLikeDislike.likeStatus = likeStatus;

    await this.postLikeDislikeRepo.save(postLikeDislike);
  }

  async deletePost(post: Post): Promise<void> {
    post.postStatus = PostStatusEnum.DELETED;
    post.deletedAt = new Date();

    await this.postsRepo.save(post);
  }
}
