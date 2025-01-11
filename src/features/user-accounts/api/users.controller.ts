import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserViewDto, UserInputDto, UsersQueryParams } from '../dto';
import { PaginatedViewDto } from '../../../core';
import { UsersService } from '../application';
import { UsersQueryRepository } from '../infrastructure';
import { Types } from 'mongoose';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get()
  async getAllUsers(
    @Query() query: UsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const queryParams = new UsersQueryParams(query);

    return this.usersQueryRepository.getAllUsers(queryParams);
  }

  @Post()
  async createUser(@Body() data: UserInputDto): Promise<UserViewDto | void> {
    await this.usersService.checkIsUserUnique('login', data.login);
    await this.usersService.checkIsUserUnique('email', data.email);

    const userId = await this.usersService.createUser(data);

    return this.usersQueryRepository.getUserById(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserById(@Param('id') id: Types.ObjectId): Promise<void> {
    return this.usersService.deleteUserById(id);
  }
}
