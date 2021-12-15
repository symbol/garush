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
import { Field, ObjectType, Resolver } from '@nestjs/graphql';
import { HeaderType } from 'garush-storage';
import { merge } from 'object-mapper';
import { BaseResponseDto } from '../../../common/dto/base.response.dto';
import { getName } from '../../../common/network';
import { FileEntity } from '../models/file.entity';

@ObjectType()
@Resolver(() => FileResponseDto)
export class FileResponseDto extends BaseResponseDto<FileResponseDto, FileEntity> {
    constructor(url: string) {
        super();
        this.url = url;
    }

    @Field()
    url: string;

    @Field()
    rootTransactionHash: string;

    @Field()
    network: string;

    @Field()
    creationHeight: string;

    @Field()
    name: string;

    @Field()
    size: number;

    @Field()
    mime: string;

    @Field()
    version: number;

    @Field()
    parser: string;

    // @Field()  TODO update graphql field
    header: Record<string, HeaderType>;

    public fromDomain(entity: FileEntity): FileResponseDto {
        const dtoToDomainMapping = {
            rootTransactionHash: 'rootTransactionHash',
            network: {
                key: 'network',
                transform: getName,
            },
            creationHeight: 'creationHeight',
            name: 'name',
            size: 'size',
            mime: 'mime',
            version: 'version',
            header: 'header',
        };

        return merge(entity, this, dtoToDomainMapping);
    }
}
