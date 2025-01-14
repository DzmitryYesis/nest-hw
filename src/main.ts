import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SETTINGS } from './settings';
import { appSetup } from './setup/app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  appSetup(app);

  await app.listen(SETTINGS.PORT, () => {
    console.log(`...server started in port ${SETTINGS.PORT}`);
  });
}

bootstrap();
