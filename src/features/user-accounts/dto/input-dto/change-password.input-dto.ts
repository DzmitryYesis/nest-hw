import { IsStringWithTrim, Trim } from '../../../../core';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { passwordLength } from '../../../../constants';

export class ChangePasswordInputDto {
  @IsStringWithTrim(passwordLength.minLength, passwordLength.maxLength)
  newPassword: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'Some problem' })
  recoveryCode: string;
}
