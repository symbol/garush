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

import { Dialect } from 'sequelize';

function getBoolean(value: string | undefined): boolean {
    return value?.toString().toLowerCase() === 'true';
}

export interface S3Configuration {
    secretAccessKey: string;
    bucket: string;
    endpoint: string;
    accessKeyId: string;
    publicLocation: string;
}

export interface ServerConfiguration {
    port: number;
}

export interface DatabaseConfiguration {
    autoLoadModels: boolean;
    password: string;
    database: string;
    dialect: Dialect;
    port: number;
    autoMigrate: boolean;
    host: string;
    username: string;
    synchronize: boolean;
}

export interface LoggerConfiguration {
    logLevel: string;
    logFileName: string;
}

export interface BullMQConfiguration {
    refreshArtJobSchedulerEvery: number;
}

export interface RedisConfiguration {
    password: string;
    port: number;
    host: string;
    username: string;
}
export interface NetworkConfiguration {
    nodeUrl: string;
    feeMultiplier: number;
}

export interface NetworkConfigurations {
    symbol: NetworkConfiguration;
    garush: NetworkConfiguration;
}
export interface Configuration {
    server: ServerConfiguration;
    database: DatabaseConfiguration;
    logger: LoggerConfiguration;
    bullmq: BullMQConfiguration;
    redis: RedisConfiguration;
    s3: S3Configuration;
    network: NetworkConfigurations;
}

export default (): Configuration => ({
    server: {
        port: parseInt(process.env.PORT) || 3000,
    },
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT) || 5432,
        username: process.env.DATABASE_USERNAME || 'admin',
        password: process.env.DATABASE_PASSWORD || 'admin',
        database: process.env.DATABASE_DB_NAME || 'garush',
        dialect: (process.env.DATABASE_DIALECT || 'postgres') as Dialect,
        autoLoadModels: getBoolean(process.env.DATABASE_AUTO_LOAD_MODELS),
        synchronize: getBoolean(process.env.DATABASE_SYNCHRONIZE),
        autoMigrate: getBoolean(process.env.DATABASE_AUTO_MIGRATE),
    },
    logger: {
        logLevel: process.env.LOGGER_LOG_LEVEL || 'info',
        logFileName: process.env.LOGGER_LOG_FILE_NAME || 'logs/garush.log',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
    },
    bullmq: {
        refreshArtJobSchedulerEvery: parseInt(process.env.BULLMQ_REFRESH_ART_JOB_SCHEDULER_EVERY) || 60000,
    },

    s3: {
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin1',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin1',
        bucket: process.env.S3_BUCKET || 'garush',
        publicLocation: process.env.S3_PUBLIC_LOCATION || 'http://localhost:9000/garush',
    },
    network: {
        symbol: {
            nodeUrl: process.env.SYMBOL_NODE_URL || 'https://001-joey-dual.symboltest.net:3001',
            feeMultiplier: parseInt(process.env.SYMBOL_FEE_MULTIPLIER) || 100,
        },
        garush: {
            nodeUrl: process.env.GARUSH_NODE_URL || 'https://demo-001.garush.dev:3001',
            feeMultiplier: parseInt(process.env.GARUSH_FEE_MULTIPLIER) || 100,
        },
    },
});
