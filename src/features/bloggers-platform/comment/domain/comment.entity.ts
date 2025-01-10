import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommentStatusEnum } from '../../../../constants';
import {
  BaseExtendedLikesInfoSchema,
  BaseLikesDislikesInfo,
} from '../../../../core/domain';
import {
  CommentatorInfo,
  CommentatorInfoSchema,
} from './commentator-info.schema';
import { CreateCommentDomainDto } from '../dto';
import { HydratedDocument, Model } from 'mongoose';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true, type: String })
  content: string;

  @Prop({ required: true, type: String })
  postId: string;

  @Prop({ type: CommentatorInfoSchema })
  commentatorInfo: CommentatorInfo;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ enum: CommentStatusEnum, default: CommentStatusEnum.ACTIVE })
  commentStatus: CommentStatusEnum;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  @Prop({ type: BaseExtendedLikesInfoSchema })
  likesInfo: BaseLikesDislikesInfo;

  static createInstance(dto: CreateCommentDomainDto): CommentDocument {
    const comment = new this();

    comment.content = dto.content;
    comment.postId = dto.postId;

    comment.commentatorInfo = {
      userId: dto.userId,
      userLogin: dto.userLogin,
    };
    comment.likesInfo = {
      likes: [],
      dislikes: [],
    };

    return comment as CommentDocument;
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;