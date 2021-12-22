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

import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseException extends HttpException {
    constructor(response: string | Record<string, any>, status: number, private errorCode: number) {
        super(response, status);
    }

    public getErrorCode(): number {
        return this.errorCode;
    }
}

export class BaseBusinessException extends BaseException {
    constructor(statusCode: number, errorCode: number, error: string, description: string) {
        const body = {
            statusCode,
            message: {
                errorMsg: error,
                errorCode: errorCode,
            },
            error: description,
        };

        super(body, statusCode, errorCode);
    }
}

export class ArtNotFoundException extends BaseBusinessException {
    constructor() {
        super(HttpStatus.NOT_FOUND, 1001, 'Art not found', 'ArtNotFound');
    }
}

export class FileNotFoundException extends BaseBusinessException {
    constructor() {
        super(HttpStatus.NOT_FOUND, 1002, 'File not found', 'FileNotFound');
    }
}
