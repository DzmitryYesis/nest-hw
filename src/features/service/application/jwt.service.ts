import { ObjectId } from 'mongodb';
import { SETTINGS } from '../../../settings';
import jwt from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';

type TAccessTokenData = {
  userId: string;
  iat: number;
  exp: number;
};

export class JwtService {
  async createAccessJWT(userId: ObjectId): Promise<string> {
    return jwt.sign({ userId: userId }, SETTINGS.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: SETTINGS.JWT_ACCESS_TOKEN_EXPIRES_TIME,
    });
  }

  async verifyAccessToken(token: string): Promise<TAccessTokenData> {
    try {
      return jwt.verify(
        token,
        SETTINGS.JWT_ACCESS_TOKEN_SECRET,
      ) as TAccessTokenData;
    } catch (e) {
      throw new UnauthorizedException(e);
    }
  }
}
