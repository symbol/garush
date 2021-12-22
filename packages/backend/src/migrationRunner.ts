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
import { Inject, Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { Sequelize } from 'sequelize-typescript';
import * as Umzug from 'umzug';

@Injectable()
export class UmzugMigrationRunner {
    private readonly logger = new Logger(UmzugMigrationRunner.name);

    private umzug: Umzug.Umzug;

    constructor(@Inject(Sequelize) sequelize: Sequelize) {
        this.umzug = new Umzug({
            storage: 'sequelize',
            storageOptions: { sequelize },
            migrations: {
                params: [
                    sequelize,
                    sequelize.constructor, // DataTypes
                    function () {
                        throw new Error(
                            'Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.',
                        );
                    },
                ],
                path: join(__dirname, 'database/migrations'),
                pattern: /^(.*)\.(mig\.js|mig\.ts)$/,
            },

            logging: (msg) => this.logger.log(msg),
        });
    }

    public migrateUp(): void {
        this.umzug.up();
    }
}
