export class PasswordRecoveryRowDto {
  userId: string;
  recoveryCode: string | null;
  expirationDate: string | null;
  lastUpdateDate: string | null;
}
