import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../domain';
import { BlogRepository } from '../infrastructure';
import { BlogInputDto } from '../dto';
import { ObjectId } from 'mongodb';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    private blogRepository: BlogRepository,
  ) {}

  async createBlog(dto: BlogInputDto): Promise<ObjectId> {
    const blog = this.BlogModel.createInstance({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });

    await this.blogRepository.save(blog);

    return blog._id;
  }

  async updateBlog(id: string, dto: BlogInputDto): Promise<void> {
    const blog = await this.blogRepository.findBlogById(id);

    if (blog) {
      blog.update(dto);

      await this.blogRepository.save(blog);
    }
  }

  async deleteBlogById(id: string): Promise<void> {
    const blog = await this.blogRepository.findBlogById(id);

    if (blog) {
      blog.deleteBlog();

      await this.blogRepository.save(blog);
    }
  }
}
