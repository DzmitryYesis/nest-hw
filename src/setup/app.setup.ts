import { INestApplication } from '@nestjs/common';
import { corsSetup } from './cors.setup';

export function appSetup(app: INestApplication): void {
  corsSetup(app);
}
