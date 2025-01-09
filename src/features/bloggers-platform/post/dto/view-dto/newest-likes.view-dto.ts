import { LikesDislikesDBData } from '../../domain';

export class NewestLikeViewDto {
  addedAt: string;
  userId: string;
  login: string;

  constructor(like: LikesDislikesDBData) {
    this.addedAt = like.addedAt.toISOString();
    this.userId = like.userId;
    this.login = like.login;
  }
}
