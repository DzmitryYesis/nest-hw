import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../domain';
import { PostRepository } from '../infrastructure';
import { PostInputDto } from '../dto';
import { ObjectId } from 'mongodb';
import { BlogRepository } from '../../blog';
import {
  Comment,
  CommentInputDto,
  CommentModelType,
  CommentRepository,
} from '../../comment';
import { UsersRepository } from '../../../user-accounts';
import { BaseLikeStatusInputDto } from '../../../../core/dto';
import { BaseLikesDislikesDBData } from '../../../../core';
import { UserLikeStatus } from '../../../../constants';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private userRepository: UsersRepository,
    private postRepository: PostRepository,
    @Inject(forwardRef(() => BlogRepository))
    private blogRepository: BlogRepository,
    private commentRepository: CommentRepository,
  ) {}

  async getPostById(id: ObjectId): Promise<string | null> {
    const post = await this.postRepository.findPostById(id);

    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    return post._id.toString();
  }

  async createPost(dto: PostInputDto): Promise<ObjectId | void> {
    const blog = await this.blogRepository.findBlogById(
      new ObjectId(dto.blogId),
    );

    if (!blog) {
      throw new NotFoundException(`Blog with id ${dto.blogId} not found`);
    }

    const post = this.PostModel.createInstance({
      title: dto.title,
      content: dto.content,
      shortDescription: dto.shortDescription,
      blogId: dto.blogId,
      blogName: blog.name,
    });

    await this.postRepository.save(post);

    return post._id;
  }

  async createCommentForPost(
    id: ObjectId,
    userId: string,
    dto: CommentInputDto,
  ): Promise<ObjectId> {
    const post = await this.postRepository.findPostById(id);

    if (!post) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Post with id ${id} not found`,
          },
        ],
      });
    }

    const user = await this.userRepository.findByCredentials(
      '_id',
      new ObjectId(userId),
    );

    if (!user) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `User with id ${id} not found`,
          },
        ],
      });
    }

    const comment = this.CommentModel.createInstance({
      postId: post.id,
      content: dto.content,
      userId: userId,
      userLogin: user.login,
    });

    await this.commentRepository.save(comment);

    return comment._id;
  }

  async updatePost(id: ObjectId, dto: PostInputDto): Promise<void> {
    const post = await this.postRepository.findPostById(id);
    const blog = await this.blogRepository.findBlogById(
      new ObjectId(dto.blogId),
    );

    if (!blog) {
      throw new NotFoundException(`Blog with id ${dto.blogId} not found`);
    }
    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    post.updatePost({ ...dto, blogName: blog.name });

    await this.postRepository.save(post);
  }

  async likeStatus(
    userId: string,
    id: ObjectId,
    data: BaseLikeStatusInputDto,
  ): Promise<void> {
    const post = await this.postRepository.findPostById(id);

    if (!post) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Post with id ${id} not found`,
          },
        ],
      });
    }

    const user = await this.userRepository.findByCredentials(
      '_id',
      new ObjectId(userId),
    );

    if (!user) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `User with id ${id} not found`,
          },
        ],
      });
    }

    const likesArr = post.extendedLikesInfo.likes.map((l) => l.userId);
    const dislikesArr = post.extendedLikesInfo.dislikes.map((d) => d.userId);
    const likeOrDislikeInfo = {
      userId: user.id,
      login: user.login,
      addedAt: new Date(),
    } as BaseLikesDislikesDBData;

    if (data.likeStatus === UserLikeStatus.LIKE) {
      if (!likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        post.addLikeOrDislike('likes', likeOrDislikeInfo);
      }
      if (!likesArr.includes(userId) && dislikesArr.includes(userId)) {
        post.deleteLikeOrDislike('dislikes', userId);
        post.addLikeOrDislike('likes', likeOrDislikeInfo);
      }
    }

    if (data.likeStatus === UserLikeStatus.DISLIKE) {
      if (!likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        post.addLikeOrDislike('dislikes', likeOrDislikeInfo);
      }
      if (likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        post.deleteLikeOrDislike('likes', userId);
        post.addLikeOrDislike('dislikes', likeOrDislikeInfo);
      }
    }

    if (data.likeStatus === UserLikeStatus.NONE) {
      if (likesArr.includes(userId)) {
        post.deleteLikeOrDislike('likes', userId);
      }

      if (dislikesArr.includes(userId)) {
        post.deleteLikeOrDislike('dislikes', userId);
      }
    }

    await this.postRepository.save(post);
  }

  async deletePostById(id: ObjectId): Promise<void> {
    const post = await this.postRepository.findPostById(id);

    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    post.deletePost();

    await this.postRepository.save(post);
  }
}
