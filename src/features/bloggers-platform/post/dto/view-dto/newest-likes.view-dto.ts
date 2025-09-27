import { PostLikeDislike } from '../../domain/post-like-dislike.entity';

export class NewestLikeViewDto {
  addedAt: string;
  userId: string;
  login: string;

  constructor(like: PostLikeDislike) {
    this.addedAt = like.addedAt.toISOString();
    this.userId = like.userId;
    this.login = like.login;
  }
}
