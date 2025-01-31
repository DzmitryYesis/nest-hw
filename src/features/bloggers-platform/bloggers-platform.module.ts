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
import {
  CommentSchema,
  Comment,
  CommentController,
  CommentService,
  CommentRepository,
  CommentQueryRepository,
} from './comment';
import { UtilitiesApplicationModule } from '../service';
import { UserAccountsModule } from '../user-accounts';
import { BlogExistsConstraint } from './post/validators/blog-exist.validator';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    UtilitiesApplicationModule,
    UserAccountsModule,
  ],
  controllers: [BlogController, PostController, CommentController],
  providers: [
    BlogExistsConstraint,
    BlogService,
    BlogRepository,
    BlogQueryRepository,
    PostService,
    PostRepository,
    PostQueryRepository,
    CommentService,
    CommentRepository,
    CommentQueryRepository,
  ],
  exports: [MongooseModule],
})
export class BloggersPlatformModule {}
