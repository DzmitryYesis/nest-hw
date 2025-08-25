import { validate, version } from 'uuid';

export const isUuidV4 = (value: string): boolean => {
  return validate(value) && version(value) === 4;
};
