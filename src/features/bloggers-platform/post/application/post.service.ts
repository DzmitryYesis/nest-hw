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

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private postRepository: PostRepository,
    @Inject(forwardRef(() => BlogRepository))
    private blogRepository: BlogRepository,
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

  async deletePostById(id: ObjectId): Promise<void> {
    const post = await this.postRepository.findPostById(id);

    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    post.deletePost();

    await this.postRepository.save(post);
  }
}
