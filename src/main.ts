import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // rodar em single core
  //process.env.UV_THREADPOOL_SIZE = '1';

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
