import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../domain';
import { BlogRepository } from '../infrastructure';
import { BlogInputDto, PostForBlogInputDto } from '../dto';
import { ObjectId } from 'mongodb';
import { Post, PostModelType, PostRepository } from '../../post';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private blogRepository: BlogRepository,
    @Inject(forwardRef(() => PostRepository))
    private postRepository: PostRepository,
  ) {}

  async getBlogById(id: ObjectId): Promise<string | null> {
    const blog = await this.blogRepository.findBlogById(id);

    if (!blog) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }

    return blog._id.toString();
  }

  async createBlog(dto: BlogInputDto): Promise<ObjectId> {
    const blog = this.BlogModel.createInstance({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });

    await this.blogRepository.save(blog);

    return blog._id;
  }

  async createPostForBlog(
    id: ObjectId,
    dto: PostForBlogInputDto,
  ): Promise<ObjectId | void> {
    const blog = await this.blogRepository.findBlogById(id);

    if (!blog) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }

    const post = this.PostModel.createInstance({
      title: dto.title,
      content: dto.content,
      shortDescription: dto.shortDescription,
      blogId: id.toString(),
      blogName: blog.name,
    });

    await this.postRepository.save(post);

    return post._id;
  }

  async updateBlog(id: ObjectId, dto: BlogInputDto): Promise<void> {
    const blog = await this.blogRepository.findBlogById(id);

    if (!blog) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }

    blog.updateBlog(dto);

    await this.blogRepository.save(blog);
  }

  async deleteBlogById(id: ObjectId): Promise<void> {
    const blog = await this.blogRepository.findBlogById(id);

    if (!blog) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }

    blog.deleteBlog();

    await this.blogRepository.save(blog);
  }
}
