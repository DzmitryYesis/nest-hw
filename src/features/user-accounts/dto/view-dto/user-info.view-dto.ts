import { UserRowDto } from '../application-dto';

export class UserInfoViewDto {
  userId: string;
  login: string;
  email: string;

  static mapToView(user: UserRowDto): UserInfoViewDto {
    const dto = new UserInfoViewDto();

    dto.login = user.login;
    dto.email = user.email;
    dto.userId = user.id;

    return dto;
  }
}
