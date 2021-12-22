/*
 * Copyright 2021 NEM (https://nem.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { Sequelize } from 'sequelize-typescript';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { Configuration, DatabaseConfiguration, LoggerConfiguration, ServerConfiguration } from './config/configuration';
import { UmzugMigrationRunner } from './migrationRunner';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get<ConfigService<Configuration>>(ConfigService);
    const loggerConfiguration = configService.get<LoggerConfiguration>('logger');

    const appName = 'Garush';
    const logger = WinstonModule.createLogger({
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.errors({ stack: true }),
                    winston.format.timestamp(),
                    nestWinstonModuleUtilities.format.nestLike(appName, { prettyPrint: true }),
                ),
            }),
            new winston.transports.File({
                format: winston.format.combine(
                    winston.format.timestamp(),
                    nestWinstonModuleUtilities.format.nestLike(appName, { prettyPrint: true }),
                ),
                level: loggerConfiguration.logLevel,
                filename: loggerConfiguration.logFileName,
            }),
        ],
    });
    app.useLogger(logger);
    app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false }));
    app.use(morgan('tiny'));
    app.enableCors();
    const options = new DocumentBuilder()
        .setTitle(appName)
        .setDescription(appName + ' API description')
        .setVersion('0.0.1')
        .addTag(appName.toLowerCase())
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document);
    fs.writeFileSync(__dirname + '/openapi-spec.json', JSON.stringify(document, null, 2));

    const databaseConfiguration = configService.get<DatabaseConfiguration>('database');
    if (databaseConfiguration.autoMigrate) {
        const umzug = app.get(UmzugMigrationRunner);
        logger.log('DB Auto migration is enabled.');
        umzug.migrateUp();
    } else {
        logger.warn('Auto migration is disabled.');
    }
    if (databaseConfiguration.synchronize) {
        const sequelize = app.get(Sequelize);
        logger.warn('DB Synchronize is enabled.');
        sequelize
            .sync({})
            .then(() => {
                logger.log('DB Synchronize succeeded!');
            })
            .catch((e) => {
                logger.error(e);
                logger.error('DB Synchronize failed!', e);
            });
    }

    const serverConfiguration = configService.get<ServerConfiguration>('server');
    await app.listen(serverConfiguration.port);
    logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
