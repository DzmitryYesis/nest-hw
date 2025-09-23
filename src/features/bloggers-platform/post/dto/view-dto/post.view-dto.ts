import { PostsLikesDislikesInfoViewDto } from './posts-likes-dislikes-info.view-dto';
import { PostRowDto } from './post-row.dto';

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: PostsLikesDislikesInfoViewDto;

  static mapToView(post: PostRowDto, userId?: string): PostViewDto {
    const dto = new PostViewDto();

    dto.id = post.id;
    dto.title = post.title;
    dto.content = post.content;
    dto.shortDescription = post.shortDescription;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.createdAt = new Date(post.createdAt);

    dto.extendedLikesInfo = new PostsLikesDislikesInfoViewDto(
      post.likes,
      post.dislikes,
      userId,
    );

    return dto;
  }
}
