import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { BlogInputDto } from '../dto';
import { Blog } from '../domain';
import { BlogStatusEnum } from '../../../../constants';

@Injectable()
export class BlogRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Blog)
    private readonly blogRepo: Repository<Blog>,
  ) {}

  async findBlogById(id: string): Promise<Blog | null> {
    return await this.blogRepo.findOne({
      where: {
        id,
        blogStatus: Not(BlogStatusEnum.DELETED),
        deletedAt: IsNull(),
      },
    });
  }

  async createBlog(
    name: string,
    description: string,
    websiteUrl: string,
  ): Promise<string> {
    const blog = this.blogRepo.create({
      name,
      description,
      websiteUrl,
    });

    await this.blogRepo.save(blog);

    return blog.id;
  }

  async updateBlog(id: string, dto: BlogInputDto): Promise<void> {
    const { name, description, websiteUrl } = dto;
    await this.blogRepo.update({ id }, { name, description, websiteUrl });
  }

  async deleteBlog(blog: Blog): Promise<void> {
    blog.blogStatus = BlogStatusEnum.DELETED;
    blog.deletedAt = new Date();

    await this.blogRepo.save(blog);
  }
}
