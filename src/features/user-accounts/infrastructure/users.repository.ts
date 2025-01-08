import { Injectable } from '@nestjs/common';
import { User, UserDocument, UserModelType } from '../domain';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { UserStatusEnum } from '../../../constants';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    protected UserModel: UserModelType,
  ) {}

  async findUserById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      _id: new ObjectId(id),
      userStatus: { $ne: UserStatusEnum.DELETED },
    });
  }

  async save(user: UserDocument) {
    await user.save();
  }
}
