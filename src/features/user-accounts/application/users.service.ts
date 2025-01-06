import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure';
import { UserInputDto } from '../dto';
import bcrypt from 'bcrypt';
import { User, UserModelType } from '../domain';
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    protected UserModel: UserModelType,
    protected usersRepository: UsersRepository,
  ) {}

  async createUser(dto: UserInputDto): Promise<ObjectId> {
    //TODO add logic to service module
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
      salt: salt,
      isConfirmed: false,
    });

    await this.usersRepository.save(user);

    return user._id;
  }
}
