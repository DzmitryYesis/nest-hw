import { Injectable, NotFoundException } from '@nestjs/common';
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
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
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

  async deleteUserById(id: string): Promise<void> {
    const user = await this.usersRepository.findUserById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    user.deleteUser();

    await this.usersRepository.save(user);
  }
}
