import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Blog,
  BlogController,
  BlogQueryRepository,
  BlogRepository,
  BlogSchema,
  BlogService,
} from './blog';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
  ],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository, BlogQueryRepository],
  exports: [MongooseModule],
})
export class BloggersPlatformModule {}
