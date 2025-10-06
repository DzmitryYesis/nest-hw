import { IsStringWithTrim } from '../../../../../core';
import { questionBodyLength } from '../../../../../constants/validate/question';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QuestionInputDto {
  @IsStringWithTrim(questionBodyLength.minLength, questionBodyLength.maxLength)
  body: string;

  @Transform(({ value }) => {
    if (!Array.isArray(value)) return value;
    return value.map((v) => (typeof v === 'string' ? v.trim() : v));
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  correctAnswers: string[];
}
