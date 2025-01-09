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
import {
  Post,
  PostController,
  PostQueryRepository,
  PostRepository,
  PostSchema,
  PostService,
} from './post';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
  ],
  controllers: [BlogController, PostController],
  providers: [
    BlogService,
    BlogRepository,
    BlogQueryRepository,
    PostService,
    PostRepository,
    PostQueryRepository,
  ],
  exports: [MongooseModule],
})
export class BloggersPlatformModule {}
