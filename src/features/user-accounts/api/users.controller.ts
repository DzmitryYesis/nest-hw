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
import { UsersService } from '../application';
import { UsersQueryRepository } from '../infrastructure';
import { UserViewDto, UserInputDto, UsersQueryParams } from '../dto';
import { PaginatedViewDto } from '../../../core/dto';

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
  async createUser(@Body() data: UserInputDto): Promise<UserViewDto> {
    const userId = await this.usersService.createUser(data);

    return this.usersQueryRepository.getUserById(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserById(@Param('id') id: string): Promise<void> {
    return this.usersService.deleteUserById(id);
  }
}
