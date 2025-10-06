import { IsBoolean } from 'class-validator';

export class QuestionPublishedStatusInputDto {
  @IsBoolean()
  published: boolean;
}
