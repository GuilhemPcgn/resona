import 'dotenv/config'; // Doit être le premier import — charge .env avant que client.ts ne lise process.env
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, raw } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Raw body pour la vérification de signature Stripe (doit être avant json())
  app.use('/stripe/webhook', raw({ type: 'application/json' }));
  // Limite augmentée pour les uploads PDF en base64 (PDF ~200KB → base64 ~270KB)
  app.use(json({ limit: '10mb' }));

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Gestion globale des erreurs HTTP
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
bootstrap();
