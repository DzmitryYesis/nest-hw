import { PostLikeDislike } from '../../domain/post-like-dislike.entity';

export class PostRowDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  updatedAt: string;
  postStatus: string;
  likes: PostLikeDislike[];
  dislikes: PostLikeDislike[];
}
