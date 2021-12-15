import {
    buildPlaceholder,
    buildTemplatedApiExceptionDecorator,
} from '@nanogiants/nestjs-swagger-api-exception-decorator';
import { BaseException } from './exceptions';

export const CustomApiException = buildTemplatedApiExceptionDecorator(
    {
        statusCode: '$status',
        message: '$description',
        error: '$status',
        errorCode: '$errorCode',
    },
    {
        requiredProperties: ['statusCode', 'message', 'errorCode'],
        placeholders: {
            errorCode: buildPlaceholder(
                () => BaseException,
                (exception) => exception.getErrorCode(),
            ),
        },
    },
);
