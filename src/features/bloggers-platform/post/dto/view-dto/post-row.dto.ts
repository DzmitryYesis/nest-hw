import { BaseLikesDislikesDBData } from '../../../../../core';

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
  likes: BaseLikesDislikesDBData[];
  dislikes: BaseLikesDislikesDBData[];
}
