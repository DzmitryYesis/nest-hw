import { User } from '../../../../user-accounts';

export class PlayerViewDto {
  id: string;
  login: string;

  constructor(playerAccount: User) {
    this.id = playerAccount.id;
    this.login = playerAccount.login;
  }
}
