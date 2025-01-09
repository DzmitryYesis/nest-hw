import { PostDocument } from '../../domain';
import { ExtendedLikesInfoViewDto } from './extended-likes-info.view-dto';

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: ExtendedLikesInfoViewDto;

  static mapToView(post: PostDocument, userId?: string): PostViewDto {
    const dto = new PostViewDto();

    dto.id = post._id.toString();
    dto.title = post.title;
    dto.content = post.content;
    dto.shortDescription = post.shortDescription;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.createdAt = post.createdAt;

    dto.extendedLikesInfo = new ExtendedLikesInfoViewDto(
      post.extendedLikesInfo.likes,
      post.extendedLikesInfo.dislikes,
      userId,
    );

    return dto;
  }
}