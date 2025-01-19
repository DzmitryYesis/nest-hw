export const SETTINGS = {
  PORT: process.env.PORT || 3005, //TODO refactoring port logic
  REFRESH_TOKEN_NAME: 'refreshToken',
  JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_SECRET || 'qwerqwer',
  JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET || 'sfghsftbhsf',
  JWT_ACCESS_TOKEN_EXPIRES_TIME: '5m',
  JWT_REFRESH_TOKEN_EXPIRES_TIME: '20m',
  AUTH_BASIC: 'admin:qwerty',
  MONGO_URL: 'mongodb://localhost:27017',
  DB_NAME: 'nest-hw',
};
