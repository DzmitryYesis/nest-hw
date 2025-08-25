export class SessionRowDto {
  id: string;
  userId: string;
  exp: string;
  iat: string;
  deviceId: string;
  deviceName: string;
  ip: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sessionStatus: string;
}
