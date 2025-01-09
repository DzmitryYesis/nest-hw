import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../domain';
import { PostRepository } from '../infrastructure';
import { PostInputDto } from '../dto';
import { ObjectId } from 'mongodb';
import { BlogRepository } from '../../blog';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private postRepository: PostRepository,
    @Inject(forwardRef(() => BlogRepository))
    private blogRepository: BlogRepository,
  ) {}

  //TODO fix problem with undefined for post
  async createPost(dto: PostInputDto): Promise<ObjectId | void> {
    const blog = await this.blogRepository.findBlogById(dto.blogId);

    if (blog) {
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
  }

  async updatePost(id: string, dto: PostInputDto): Promise<void> {
    const post = await this.postRepository.findPostById(id);
    const blog = await this.blogRepository.findBlogById(dto.blogId);
    if (post && blog) {
      post.updatePost({ ...dto, blogName: blog.name });

      await this.postRepository.save(post);
    }
  }

  async deletePostById(id: string): Promise<void> {
    const post = await this.postRepository.findPostById(id);

    if (post) {
      post.deletePost();

      await this.postRepository.save(post);
    }
  }
}
