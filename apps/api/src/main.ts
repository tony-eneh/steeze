import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from './common/pipes/validation.pipe';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  // rawBody is needed so the Paystack webhook can verify signatures against the
  // exact bytes Paystack signed rather than a re-serialised object.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Render (and most PaaS) terminate TLS at a proxy, so the client IP used for
  // rate limiting only comes through when the proxy headers are trusted.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // Swagger UI loads its own inline assets.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS. Local dev origins are always allowed; deployed origins come
  // from CORS_ORIGINS (comma separated) so they can change without a rebuild.
  const localOrigins = [
    'http://localhost:3000',
    'http://localhost:4200',
    'http://localhost:8100',
    'capacitor://localhost',
    'ionic://localhost',
  ];
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: [...localOrigins, ...configuredOrigins],
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(ValidationPipe);

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Steeze API')
    .setDescription('Steeze fashion marketplace API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${port}/api/docs`,
  );
}
bootstrap();
