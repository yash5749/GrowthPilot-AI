import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('channel');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 4001;

  await app.listen(port);
  console.log(`Channel Service running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/channel/health`);
  console.log(`Send endpoint: http://localhost:${port}/channel/send`);
}

bootstrap();