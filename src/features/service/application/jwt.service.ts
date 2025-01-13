import { ObjectId } from 'mongodb';
import { SETTINGS } from '../../../settings';
import jwt from 'jsonwebtoken';

export class JwtService {
  async createAccessJWT(userId: ObjectId): Promise<string> {
    return jwt.sign({ userId: userId }, SETTINGS.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: SETTINGS.JWT_ACCESS_TOKEN_EXPIRES_TIME,
    });
  }
}
