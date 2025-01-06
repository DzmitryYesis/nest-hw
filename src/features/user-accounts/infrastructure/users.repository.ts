import { Injectable } from '@nestjs/common';
import { UserDocument } from '../domain';

@Injectable()
export class UsersRepository {
  async save(user: UserDocument) {
    await user.save();
  }
}
