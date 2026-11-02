import { applyApiContractOverrides } from './swagger/api-contract-overrides';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
export function createOpenApiDocument(app: INestApplication) {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Esoteric Library API')
      .setDescription('Versioned REST API for the Esoteric Library platform.')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('System')
      .build(),
  );
  return applyApiContractOverrides(document);
}
export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup('docs', app, createOpenApiDocument(app), {
    swaggerOptions: { persistAuthorization: true },
  });
}
