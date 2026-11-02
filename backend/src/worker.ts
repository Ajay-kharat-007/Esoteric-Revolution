import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { InternalOperationsService } from './modules/internal-operations/internal.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const operations = app.get(InternalOperationsService);
  let running = false;
  const processOutbox = async () => {
    if (running) return;
    running = true;
    try {
      await operations.processOutbox();
    } finally {
      running = false;
    }
  };
  await processOutbox();
  const timer = setInterval(() => void processOutbox(), 5000);
  const shutdown = async () => {
    clearInterval(timer);
    await app.close();
    process.exit(0);
  };
  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());
}
void bootstrap();
