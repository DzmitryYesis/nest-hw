import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto';
import { User, UserModelType } from '../domain';
import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { UsersRepository } from '../infrastructure';
import { CryptoService, EmailNotificationService } from '../../service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
    private emailNotificationService: EmailNotificationService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<ObjectId> {
    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.password,
    );

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash: passwordHash,
      isConfirmed: dto.isAdmin,
    });

    if (!dto.isAdmin) {
      this.emailNotificationService
        .sendEmailWithConfirmationCode({
          login: user.login,
          email: user.email,
          code: user.emailConfirmation.confirmationCode,
        })
        .catch((e) => console.log('Error send email: ', e));
    }

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
