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
import { Field, ObjectType } from '@nestjs/graphql';
import { merge } from 'object-mapper';
import { BaseResponseDto } from '../../../common/dto/base.response.dto';
import { getName } from '../../../common/network';
import { FileResponseDto } from '../../file/dto/file.response.dto';
import { ArtEntity } from '../models/art.entity';

@ObjectType()
export class ArtResponseDto extends BaseResponseDto<ArtResponseDto, ArtEntity> {
    constructor(url: string) {
        super();
        this.url = url;
    }

    @Field()
    url: string;

    @Field()
    mosaicId: string;

    // @Field() TODO update graphql field
    file: FileResponseDto;

    @Field()
    artistAddress: string;

    @Field()
    ownerAddress: string;

    @Field()
    network: string;

    @Field()
    creationHeight: string;

    @Field()
    description: string;

    @Field()
    royalty: number;

    public fromDomain(entity: ArtEntity): ArtResponseDto {
        const dtoToDomainMapping = {
            mosaicId: 'mosaicId',
            rootTransactionHash: 'rootTransactionHash',
            artistAddress: 'artistAddress',
            description: 'description',
            ownerAddress: 'ownerAddress',
            file: {
                key: 'file',
                transform: (file) => (file ? new FileResponseDto(this.url).fromDomain(file) : undefined),
            },
            network: {
                key: 'network',
                transform: getName,
            },
            creationHeight: 'creationHeight',
            royalty: 'royalty',
        };

        return merge(entity, this, dtoToDomainMapping);
    }
}
