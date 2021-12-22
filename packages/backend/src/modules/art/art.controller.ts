import { Controller, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { ApiQuery } from '@nestjs/swagger';
import { ArtNotFoundException } from '../../common/exception/exceptions';
import { Network } from '../../common/network';
import { Configuration, S3Configuration } from '../../config/configuration';
import { ArtService } from './art.service';
import { ArtResponseDto } from './dto/art.response.dto';
import { ArtEntity } from './models/art.entity';

@Controller('art')
@Resolver(() => ArtResponseDto)
export class ArtController {
    constructor(private service: ArtService, private configService: ConfigService<Configuration>) {}

    private toUrl(art: ArtEntity) {
        const rootTransactionHash = art.file?.rootTransactionHash;
        if (!rootTransactionHash) {
            return undefined;
        }
        const baseUrl = this.configService.get<S3Configuration>('s3').publicLocation;
        return `${baseUrl}/${rootTransactionHash}`;
    }

    @Get()
    @Query(() => [ArtResponseDto], { name: 'arts' })
    public async getAll(): Promise<ArtResponseDto[]> {
        return this.service.getAll().then((list) => list.map((entity) => new ArtResponseDto(this.toUrl(entity)).fromDomain(entity)));
    }

    @Get(':mosaicId')
    @ApiQuery({
        required: true,
        name: 'mosaicId',
        type: 'string',
    })
    public async getOne(@Param('mosaicId') mosaicId: string): Promise<ArtResponseDto> {
        const entity = await this.service.getOne(mosaicId);
        if (!entity) {
            throw new ArtNotFoundException();
        }
        return new ArtResponseDto(this.toUrl(entity)).fromDomain(entity);
    }

    // TODO, for some reason, nextjs only takes the first annotated param
    // @Param('mosaicId') @Args('mosaicId') mosaicId: string
    // only takes the first rest param, not the graphql one
    @Query(() => ArtResponseDto, { name: 'art' })
    public async getOneGraphQql(@Args('mosaicId') mosaicId: string): Promise<ArtResponseDto> {
        return this.getOne(mosaicId);
    }

    @Get('refresh/symbol')
    public async refreshSymbol(): Promise<void> {
        await this.service.refreshArtGivenNetwork(Network.SYMBOL);
    }

    @Get('refresh/symbol/storage')
    public async refreshSymbolStorage(): Promise<void> {
        await this.service.refreshNetworkStorage(Network.SYMBOL);
    }
    @Get('refresh/garush')
    public async refreshGarush(): Promise<void> {
        await this.service.refreshArtGivenNetwork(Network.GARUSH);
    }

    @Get('refresh/garush/storage')
    public async refreshGarushStorage(): Promise<void> {
        await this.service.refreshNetworkStorage(Network.GARUSH);
    }
}
