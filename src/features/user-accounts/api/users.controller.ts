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
  UseGuards,
} from '@nestjs/common';
import { UserViewDto, UsersQueryParams, UserInputDto } from '../dto';
import { PaginatedViewDto, BasicAuthGuard } from '../../../core';
import { USERS_API_PATH } from '../../../constants';
import { UsersSqlQueryRepository } from '../infrastructure/query/users.sql-query-repository';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/use-cases/create-user.use-case';
import { DeleteUserByIdCommand } from '../application/use-cases/delete-user-by-id.use-case';

@UseGuards(BasicAuthGuard)
@Controller(USERS_API_PATH)
export class UsersController {
  constructor(
    protected usersSqlQueryRepository: UsersSqlQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getAllUsers(
    @Query() query: UsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const queryParams = new UsersQueryParams(query);

    return this.usersSqlQueryRepository.getAllUsers(queryParams);
  }

  @Post()
  async createUser(@Body() data: UserInputDto): Promise<UserViewDto | void> {
    const userId = await this.commandBus.execute(
      new CreateUserCommand({ ...data, isAdmin: false }),
    );

    return this.usersSqlQueryRepository.getUserById(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserById(@Param('id') id: string): Promise<void> {
    return await this.commandBus.execute(new DeleteUserByIdCommand(id));
  }
}
