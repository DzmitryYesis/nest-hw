import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class CryptoService {
  async createPasswordHash(password: string): Promise<string> {
    const salt = await this.createPasswordSalt();
    return await bcrypt.hash(password, salt);
  }

  async createPasswordSalt(): Promise<string> {
    return await bcrypt.genSalt(10);
  }
}
