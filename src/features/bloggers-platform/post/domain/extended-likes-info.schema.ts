import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  LikesDislikesDBData,
  LikesDislikesDBDataSchema,
} from './likes-dislikes-db-data.schema';

@Schema({
  _id: false,
})
export class ExtendedLikesInfo {
  @Prop({ type: [LikesDislikesDBDataSchema], default: [] })
  likes: LikesDislikesDBData[];

  @Prop({ type: [LikesDislikesDBDataSchema], default: [] })
  dislikes: LikesDislikesDBData[];
}

export const ExtendedLikesInfoSchema =
  SchemaFactory.createForClass(ExtendedLikesInfo);
