import { UserDocument } from '../../domain';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView(user: UserDocument): UserViewDto {
    const dto = new UserViewDto();

    dto.email = user.accountData.email;
    dto.login = user.accountData.login;
    dto.id = user._id.toString();
    dto.createdAt = user.createdAt;

    return dto;
  }
}
