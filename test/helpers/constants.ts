import { SETTINGS } from '../../src/settings';

export const authBasic = Buffer.from(SETTINGS.AUTH_BASIC, 'utf8').toString(
  'base64',
);

export const invalidId = '674c1117e773331c44445554';
