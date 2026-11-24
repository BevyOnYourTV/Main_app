import { NestFactory } from '@nestjs/core';
import type { LogLevel } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logLevels: LogLevel[] = ['log', 'error', 'warn'];
  if (process.env.LOG_LEVEL === 'debug') logLevels.push('debug');
  const app = await NestFactory.create(AppModule, { logger: logLevels });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
