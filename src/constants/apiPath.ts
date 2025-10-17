export const SUPER_ADMIN = 'sa';
export const QUIZ = 'quiz';
export const USERS_API_PATH = 'sa/users';
export const BLOGS_API_PATH = 'blogs';
export const BLOGS_SA_API_PATH = 'sa/blogs';

export const COMMENTS_API_PATH = {
  ROOT_URL: 'comments',
  LIKE_STATUS: 'like-status',
};

export const POSTS_API_PATH = {
  SUPER_ADMIN: 'sa/posts',
  ROOT_URL: 'posts',
  LIKE_STATUS: 'like-status',
};

export const AUTH_API_PATH = {
  ROOT_URL: 'auth',
  REGISTRATION: 'registration',
  REGISTRATION_CONFIRMATION: 'registration-confirmation',
  REGISTRATION_EMAIL_RESENDING: 'registration-email-resending',
  PASSWORD_RECOVERY: 'password-recovery',
  NEW_PASSWORD: 'new-password',
  LOGIN: 'login',
  REFRESH_TOKEN: 'refresh-token',
  LOGOUT: 'logout',
  ME: 'me',
};

export const SECURITY_API_PATH = {
  ROOT_URL: 'security',
  DEVICES: 'devices',
};

export const DELETE_ALL_API_PATH = {
  ROOT_URL: 'testing',
  DELETE_ALL_DATA: 'all-data',
};

export const QUESTION_API_PATH = `${SUPER_ADMIN}/${QUIZ}/questions`;

export const GAME_API_PATH = {
  ROOT_URL: 'pair-game-quiz',
  MY: 'pairs/my',
  MY_STATISTIC: 'users/my-statistic',
  CONNECTION: 'pairs/connection',
  MY_CURRENT: 'pairs/my-current',
  ANSWERS: 'answers',
};
