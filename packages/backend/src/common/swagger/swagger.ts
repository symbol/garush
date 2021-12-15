import { ApiProperty } from '@nestjs/swagger';

enum ErrorTypes {
    FATAL = 'FATAL',
    WARN = 'WARN',
    INFO = 'INFO',
}

export class SwaggerAnnotations {
    @ApiProperty({
        enum: ErrorTypes,
        enumName: 'ErrorTypes',
    })
    error: ErrorTypes;
}

export class BaseExceptionTemplate {
    @ApiProperty({ required: true, type: String })
    errorMsg: string;

    @ApiProperty({ required: true, type: Number })
    errorCode: number;
}
