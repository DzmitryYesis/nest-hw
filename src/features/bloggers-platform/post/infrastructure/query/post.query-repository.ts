import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain';
import { ObjectId } from 'mongodb';
import { PostStatusEnum } from '../../../../../constants';
import { PostsQueryParams, PostViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../../core/dto';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
  ) {}

  async getAllPosts(
    query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter = {
      postsStatus: { $ne: PostStatusEnum.DELETED },
    };

    const posts = await this.PostModel.find(filter)
      .sort({
        [query.sortBy]: query.sortDirection,
      })
      .skip((query.pageNumber - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = posts.map((post) => PostViewDto.mapToView(post));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getPostById(id: ObjectId): Promise<PostViewDto> {
    const post = await this.PostModel.findOne({
      _id: id,
      postStatus: { $ne: PostStatusEnum.DELETED },
    });

    //TODO fix logic for error. Add logic to modal
    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    return PostViewDto.mapToView(post);
  }
}