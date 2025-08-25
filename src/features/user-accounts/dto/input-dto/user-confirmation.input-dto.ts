import { Trim } from '../../../../core';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UserConfirmationInputDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'code must be a valid UUID v4' })
  code: string;
}
