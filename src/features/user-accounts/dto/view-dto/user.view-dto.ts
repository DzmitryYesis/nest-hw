import { UserRowDto } from '../application-dto';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView(user: UserRowDto): UserViewDto {
    const dto = new UserViewDto();

    dto.email = user.email;
    dto.login = user.login;
    dto.id = user.id;
    dto.createdAt = new Date(user.createdAt);

    return dto;
  }
}
