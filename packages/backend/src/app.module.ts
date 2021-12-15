import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { SequelizeModule } from '@nestjs/sequelize';
import configuration, { Configuration, DatabaseConfiguration, RedisConfiguration } from './config/configuration';
import { UmzugMigrationRunner } from './migrationRunner';
import { ArtModule } from './modules/art/art.module';
import { ArtEntity } from './modules/art/models/art.entity';
import { ArtRefreshLogEntity } from './modules/art/models/art.refresh.log.entity';
import { FileModule } from './modules/file/file.module';
import { FileEntity } from './modules/file/models/file.entity';
import { NetworkModule } from './modules/network/network.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [configuration],
            expandVariables: true,
            isGlobal: true,
        }),
        SequelizeModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService<Configuration>) => {
                const database = config.get<DatabaseConfiguration>('database');
                return {
                    ...database,
                    dialectOptions: { decimalNumbers: true },
                    models: [ArtEntity, ArtRefreshLogEntity, FileEntity],
                };
            },
        }),
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService<Configuration>) => {
                const redis = config.get<RedisConfiguration>('redis');
                return {
                    redis: redis,
                };
            },
        }),
        GraphQLModule.forRoot({
            include: [ArtModule, FileModule],
            autoSchemaFile: true,
            debug: true,
            playground: true,
        }),
        BullModule.registerQueueAsync({ name: 'garush' }),
        ArtModule,
        FileModule,
        NetworkModule,
    ],
    providers: [UmzugMigrationRunner],
})
export class AppModule {}
