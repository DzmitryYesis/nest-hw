import { Injectable, NotFoundException } from '@nestjs/common';
import { UserViewDto } from '../../dto';
import { User, UserModelType } from '../../domain';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    protected UserModel: UserModelType,
  ) {}

  async getUserById(id: ObjectId): Promise<UserViewDto> {
    const user = await this.UserModel.findOne({
      _id: id,
    });

    //TODO fix logic for error. Add logic to modal
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return UserViewDto.mapToView(user);
  }
}
