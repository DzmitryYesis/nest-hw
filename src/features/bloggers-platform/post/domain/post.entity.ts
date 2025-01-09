import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PostStatusEnum } from '../../../../constants';
import { HydratedDocument, Model } from 'mongoose';
import { CreatePostDomainDto, UpdatePostDomainDto } from '../dto';
import {
  ExtendedLikesInfo,
  ExtendedLikesInfoSchema,
} from './extended-likes-info.schema';

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  shortDescription: string;

  @Prop({ required: true, type: String })
  content: string;

  @Prop({ required: true, type: String })
  blogId: string;

  @Prop({ required: true, type: String })
  blogName: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ enum: PostStatusEnum, default: PostStatusEnum.ACTIVE })
  postStatus: PostStatusEnum;

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  @Prop({ type: ExtendedLikesInfoSchema })
  extendedLikesInfo: ExtendedLikesInfo;

  static createInstance(dto: CreatePostDomainDto): PostDocument {
    const post = new this();

    post.title = dto.title;
    post.content = dto.content;
    post.shortDescription = dto.shortDescription;
    post.blogName = dto.blogName;
    post.blogId = dto.blogId;
    post.extendedLikesInfo = {
      likes: [],
      dislikes: [],
    };

    return post as PostDocument;
  }

  updatePost(dto: UpdatePostDomainDto): void {
    this.title = dto.title;
    this.shortDescription = dto.shortDescription;
    this.content = dto.content;
    this.blogId = dto.blogId;
    this.blogName = dto.blogName;
  }

  deletePost(): void {
    this.postStatus = PostStatusEnum.DELETED;
    this.deletedAt = new Date();
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<PostDocument> & typeof Post;
