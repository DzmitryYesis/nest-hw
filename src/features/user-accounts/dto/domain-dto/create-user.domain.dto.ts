export class CreateUserDomainDto {
  login: string;
  email: string;
  salt: string;
  passwordHash: string;
  isConfirmed: boolean;
}
