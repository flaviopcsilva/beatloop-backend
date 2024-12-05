import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.use(
    express.json({
      limit: '50mb', // Adjust this limit as needed (e.g., 50MB)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}1
bootstrap();
