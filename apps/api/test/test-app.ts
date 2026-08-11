import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '../src/common/pipes/validation.pipe';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Boots the app with the same global pipes, filters and interceptors as
 * main.ts so e2e tests see production-shaped responses. Rate limiting is
 * disabled because a test run fires far more requests than a real client.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication();

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(ValidationPipe);
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.init();

  return app;
}

/** Unique-per-run email so repeated runs do not collide on the users table. */
export function uniqueEmail(prefix: string): string {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${suffix}@steeze.test`;
}
