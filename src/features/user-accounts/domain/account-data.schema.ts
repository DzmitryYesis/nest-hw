import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  _id: false,
})
export class AccountData {
  @Prop({ required: true, type: String })
  login: string;

  @Prop({ required: true, type: String })
  email: string;

  @Prop({ required: true, type: String })
  passwordHash: string;

  @Prop({ required: true, type: String })
  salt: string;
}

export const AccountDataSchema = SchemaFactory.createForClass(AccountData);
