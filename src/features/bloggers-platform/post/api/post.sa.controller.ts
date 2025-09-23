import { Controller, Get, Param, Query } from '@nestjs/common';
import { PostQueryRepository } from '../infrastructure';
import { PostsQueryParams, PostViewDto } from '../dto';
import { PaginatedViewDto } from '../../../../core';
import { POSTS_API_PATH } from '../../../../constants';

@Controller(POSTS_API_PATH.ROOT_URL)
export class PostSAController {
  constructor(private postQueryRepository: PostQueryRepository) {}

  @Get()
  async getAllPosts(
    @Query() query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryParams = new PostsQueryParams(query);

    return this.postQueryRepository.getAllPosts(queryParams);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string): Promise<PostViewDto> {
    return this.postQueryRepository.getPostById(id);
  }
}
