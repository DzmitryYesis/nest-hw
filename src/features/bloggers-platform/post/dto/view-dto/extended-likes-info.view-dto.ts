import { UserLikeStatus } from '../../../../../constants';
import { LikesDislikesDBData } from '../../domain';
import { NewestLikeViewDto } from './newest-likes.view-dto';

export class ExtendedLikesInfoViewDto {
  likesCount: number;
  dislikesCount: number;
  myStatus: UserLikeStatus;
  newestLikes: NewestLikeViewDto[];

  constructor(
    likes: LikesDislikesDBData[],
    dislikes: LikesDislikesDBData[],
    userId?: string,
  ) {
    this.likesCount = likes.length;
    this.dislikesCount = dislikes.length;
    this.myStatus = ExtendedLikesInfoViewDto.getUserLikeStatus(
      likes,
      dislikes,
      userId,
    );
    this.newestLikes = likes
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
      .slice(0, 3)
      .map((like) => new NewestLikeViewDto(like));
  }

  private static getUserLikeStatus(
    likes: LikesDislikesDBData[],
    dislikes: LikesDislikesDBData[],
    userId?: string,
  ): UserLikeStatus {
    if (userId && likes.some((item) => item.userId === userId)) {
      return UserLikeStatus.LIKE;
    }
    if (userId && dislikes.some((item) => item.userId === userId)) {
      return UserLikeStatus.DISLIKE;
    }
    return UserLikeStatus.NONE;
  }
}
