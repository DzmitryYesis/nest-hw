import { User } from '../../domain';

export class UserInfoViewDto {
  userId: string;
  login: string;
  email: string;

  static mapToView(user: User): UserInfoViewDto {
    const dto = new UserInfoViewDto();

    dto.login = user.login;
    dto.email = user.email;
    dto.userId = user.id;

    return dto;
  }
}
