import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  app.useGlobalPipes(new ValidationPipe());


  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}
bootstrap();
