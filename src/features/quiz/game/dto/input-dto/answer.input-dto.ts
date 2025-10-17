import { Trim } from '../../../../../core';
import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerInputDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  answer: string;
}
