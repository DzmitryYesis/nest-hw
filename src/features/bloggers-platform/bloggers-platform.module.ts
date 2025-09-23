import { Module } from '@nestjs/common';
import { BlogController, BlogQueryRepository, BlogRepository } from './blog';
import { UtilitiesApplicationModule } from '../service';
import { UserAccountsModule } from '../user-accounts';
import { BlogExistsConstraint } from './post/validators/blog-exist.validator';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateBlogUseCase } from './blog/application/use-cases/create-blog.use-case';
import { GetBlogByIdUseCase } from './blog/application/use-cases/get-blog-by-id.use-case';
import { UpdateBlogUseCase } from './blog/application/use-cases/update-blog.use-case';
import { BlogSAController } from './blog/api/blog.sa.controller';
import { DeleteBlogUseCase } from './blog/application/use-cases/delete-blog.use-case';
import { PostQueryRepository, PostRepository } from './post';
import { CreatePostForBlogUseCase } from './blog/application/use-cases/create-post-for-blog.use-case';
import { DeletePostUseCase } from './post/application/use-cases/delete-post.use-case';
import { GetPostByIdUseCase } from './post/application/use-cases/get-post-by-id.use-case';
import { UpdatePostUseCase } from './post/application/use-cases/update-post.use-case';
import { PostSAController } from './post/api/post.sa.controller';

const useCases = [
  CreateBlogUseCase,
  CreatePostForBlogUseCase,
  GetBlogByIdUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  //ChangePostLikeStatusUseCase,
  //CreateCommentForPostUseCase,
  //CreatePostUseCase,
  DeletePostUseCase,
  GetPostByIdUseCase,
  UpdatePostUseCase,
  //UpdateCommentUseCase,
  //DeleteCommentUseCase,
  //ChangeCommentLikeStatusUseCase,
];

//TODO create method for logic when try to find entity(create common service where try to find entity)
@Module({
  imports: [UtilitiesApplicationModule, UserAccountsModule, CqrsModule],
  controllers: [
    BlogController,
    BlogSAController,
    //PostController,
    PostSAController,
    //CommentController,
  ],
  providers: [
    BlogExistsConstraint,
    BlogRepository,
    BlogQueryRepository,
    PostRepository,
    PostQueryRepository,
    //CommentRepository,
    //CommentQueryRepository,
    ...useCases,
  ],
  exports: [],
})
export class BloggersPlatformModule {}
