import { FastifyAdapter, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config';
import * as helmet from 'helmet';
import { join } from 'path';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule, new FastifyAdapter(), { cors: true });
  const app = await NestFactory.create(AppModule, { cors: true });
  const config: ConfigService = app.get(ConfigService);
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      forbidUnknownValues: true,
    }),
  );

  // app.useStaticAssets(join(__dirname + './../public')); // for uploaded images

  const options = new DocumentBuilder()
    .setTitle('Sumo API Docs')
    .setDescription('Sumo API for Multi-tenant kubernetes')
    .setExternalDoc('Github Repo', 'https://github.com/xmlking/ngx-starter-kit/tree/master/apps/api')
    .setVersion(config.getVersion())
    .addTag('Sumo')
    .addTag('External')
    .setSchemes(config.isProd() ? 'https' : 'http')
    .addOAuth2(
      'implicit',
      `${config.get('OIDC_ISSUER_URL')}/protocol/openid-connect/auth`,
      `${config.get('OIDC_ISSUER_URL')}/protocol/openid-connect/token`,
    )
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      oauth2RedirectUrl: `${config.get('DOMAIN_URL')}/docs/oauth2-redirect.html`,
      oauth: {
        clientId: config.get('OIDC_CLIENT'),
        appName: 'Sumo API',
        // scopeSeparator: ' ',
        // additionalQueryStringParams: {audience: config.get('OIDC_AUDIENCE')},
      },
    },
  });

  await app.listen(config.getNumber('PORT') || 3000, '0.0.0.0');
}

bootstrap();
