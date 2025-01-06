import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from '../application';
import { UsersQueryRepository } from '../infrastructure';
import { UserViewDto, UserInputDto } from '../dto';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private usersQueryRepository: UsersQueryRepository,
  ) {}

  @Post()
  async createUser(@Body() data: UserInputDto): Promise<UserViewDto> {
    const userId = await this.usersService.createUser(data);

    return this.usersQueryRepository.getUserById(userId);
  }
}
