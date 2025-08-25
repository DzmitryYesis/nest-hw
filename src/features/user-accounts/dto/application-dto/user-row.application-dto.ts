export class UserRowDto {
  id: string;
  login: string;
  email: string;
  passwordHash: string;
  userStatus: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
  isConfirmed: boolean;
}
