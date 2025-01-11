import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserInputDto } from '../dto';
import bcrypt from 'bcrypt';
import { User, UserModelType } from '../domain';
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { UsersRepository } from '../infrastructure';

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

  async checkIsUserUnique(field: string, value: string): Promise<boolean> {
    const user = await this.usersRepository.findByCredentials(field, value);

    if (user) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: field,
            message: 'not unique',
          },
        ],
      });
    }

    return false;
  }

  async deleteUserById(id: ObjectId): Promise<void> {
    const user = await this.usersRepository.findByCredentials('_id', id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    user.deleteUser();

    await this.usersRepository.save(user);
  }
}
