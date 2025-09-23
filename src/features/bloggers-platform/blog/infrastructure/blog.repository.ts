import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BlogInputDto, BlogViewDto } from '../dto';

@Injectable()
export class BlogRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async findBlogById(id: string): Promise<BlogViewDto | null> {
    const res = await this.dataSource.query(
      `SELECT * FROM public."Blogs" WHERE "id" = $1::uuid AND "blogStatus" <> 'DELETED'
    AND "deletedAt" IS NULL`,
      [id],
    );

    if (res.length === 0) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }

    return BlogViewDto.mapToView(res[0]);
  }

  async createBlog(
    name: string,
    description: string,
    websiteUrl: string,
  ): Promise<string> {
    const sql = `INSERT INTO public."Blogs" ("name", "description", "websiteUrl")
                 VALUES ($1, $2, $3)
                 RETURNING "id"`;

    const params = [name, description, websiteUrl];

    const res = await this.dataSource.query(sql, params);

    return res[0].id;
  }

  async updateBlog(id: string, dto: BlogInputDto): Promise<boolean> {
    const { name, description, websiteUrl } = dto;
    const sql = `UPDATE public."Blogs"
               SET "name" = $1,
                   "description" = $2,
                   "websiteUrl" = $3
               WHERE "id" = $4`;

    const params = [name, description, websiteUrl, id];

    const res = await this.dataSource.query(sql, params);

    return res.rowCount > 0;
  }

  async deleteBlog(id: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE public."Blogs" SET "blogStatus" = 'DELETED', "deletedAt" = now() WHERE "id" = $1::uuid`,
      [id],
    );
  }
}
