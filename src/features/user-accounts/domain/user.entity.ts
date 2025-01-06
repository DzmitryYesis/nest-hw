import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AccountData, AccountDataSchema } from './account-data.schema';
import {
  EmailConfirmation,
  EmailConfirmationSchema,
} from './email-confirmation.schema';
import { CreateUserDomainDto } from '../dto';
import { HydratedDocument, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { v4 as uuidV4 } from 'uuid';
import { add } from 'date-fns';

//TODO create folder for global classes or config classes
export class BaseEntity {
  _id: ObjectId;
}

@Schema({ timestamps: true })
export class User extends BaseEntity {
  @Prop({ type: AccountDataSchema })
  accountData: AccountData;

  @Prop({ type: EmailConfirmationSchema })
  emailConfirmation: EmailConfirmation;

  @Prop({ type: Date })
  createdAt: Date;

  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();

    user.accountData = {
      email: dto.email,
      login: dto.login,
      salt: dto.salt,
      passwordHash: dto.passwordHash,
    } as AccountData;

    user.emailConfirmation = {
      confirmationCode: uuidV4(),
      expirationDate: add(new Date(), {
        hours: 1,
        minutes: 3,
      }),
      isConfirmed: dto.isConfirmed,
    } as EmailConfirmation;

    return user as UserDocument;
  }

  getId(): ObjectId {
    return this._id;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
