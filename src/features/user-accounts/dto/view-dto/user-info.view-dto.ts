import { UserDocument } from '../../domain';

export class UserInfoViewDto {
  id: string;
  login: string;
  email: string;

  static mapToView(user: UserDocument): UserInfoViewDto {
    const dto = new UserInfoViewDto();

    dto.login = user.login;
    dto.email = user.email;
    dto.id = user._id.toString();

    return dto;
  }
}
