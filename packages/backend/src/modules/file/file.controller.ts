import { Controller, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Args, Query } from '@nestjs/graphql';
import { ApiQuery } from '@nestjs/swagger';
import { FileNotFoundException } from '../../common/exception/exceptions';
import { Configuration, S3Configuration } from '../../config/configuration';
import { FileResponseDto } from './dto/file.response.dto';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
    constructor(private service: FileService, private configService: ConfigService<Configuration>) {}

    private toUrl(rootTransactionHash: string) {
        const baseUrl = this.configService.get<S3Configuration>('s3').publicLocation;
        return `${baseUrl}/${rootTransactionHash}`;
    }

    @Get()
    @Query(() => [FileResponseDto], { name: 'files' })
    public async getAll(): Promise<FileResponseDto[]> {
        return this.service
            .getAll()
            .then((list) => list.map((entity) => new FileResponseDto(this.toUrl(entity.rootTransactionHash)).fromDomain(entity)));
    }

    @Get('refresh/:rootTransactionHash')
    @ApiQuery({
        required: true,
        name: 'rootTransactionHash',
        type: 'string',
    })
    public async refresh(@Param('rootTransactionHash') rootTransactionHash: string): Promise<FileResponseDto> {
        const network = await this.service.findNetwork(rootTransactionHash);
        if (!network) {
            throw new FileNotFoundException();
        }
        const entity = await this.service.refresh(network, rootTransactionHash);
        if (!entity) {
            throw new FileNotFoundException();
        }
        return new FileResponseDto(this.toUrl(entity.rootTransactionHash)).fromDomain(entity);
    }
    @Get(':rootTransactionHash')
    @ApiQuery({
        required: true,
        name: 'rootTransactionHash',
        type: 'string',
    })
    public async getOne(@Param('rootTransactionHash') rootTransactionHash: string): Promise<FileResponseDto> {
        const entity = await this.service.getOne(rootTransactionHash);
        if (!entity) {
            throw new FileNotFoundException();
        }
        return new FileResponseDto(this.toUrl(entity.rootTransactionHash)).fromDomain(entity);
    }

    // TODO, for some reason, nextjs only takes the first annotated param
    // @Param('rootTransactionHash') @Args('rootTransactionHash') rootTransactionHash: string
    // only takes the first rest param, not the graphql one
    @Query(() => FileResponseDto, { name: 'file' })
    public async getOneGraphQql(@Args('rootTransactionHash') rootTransactionHash: string): Promise<FileResponseDto> {
        return this.getOne(rootTransactionHash);
    }
}
