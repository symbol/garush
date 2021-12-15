import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Process, Processor } from '@nestjs/bull';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Job } from 'bull';
import { FileMetadataWithTransaction, StorageService, Utils } from 'garush-storage';
import { firstValueFrom } from 'rxjs';
import { TransactionGroup } from 'symbol-sdk';
import { Network } from '../../common/network';
import { Configuration, S3Configuration } from '../../config/configuration';
import { NetworkService } from '../network/network.service';
import { FileEntity } from './models/file.entity';

@Injectable()
@Processor('garush')
export class FileService {
    private readonly logger = new Logger(FileService.name);
    constructor(
        private readonly configService: ConfigService<Configuration>,
        @InjectModel(FileEntity)
        private readonly fileEntityModel: typeof FileEntity,
        @Inject(NetworkService) private readonly networkService: NetworkService,
    ) {}

    public async getAll(): Promise<FileEntity[]> {
        return this.fileEntityModel.findAll();
    }

    public async getOne(rootTransactionHash: string): Promise<FileEntity | undefined> {
        return this.fileEntityModel.findOne({ where: { rootTransactionHash: rootTransactionHash } });
    }

    @Process('refresh_storage')
    async refreshJob(job: Job<{ network: Network; rootTransactionHash: string }>) {
        return this.refresh(job.data.network, job.data.rootTransactionHash);
    }

    public async findNetwork(rootTransactionHash: string): Promise<Network> {
        for (const network of [Network.GARUSH, Network.SYMBOL]) {
            try {
                await firstValueFrom(
                    this.networkService
                        .getRepositoryFactory(network)
                        .createTransactionRepository()
                        .getTransaction(rootTransactionHash, TransactionGroup.Confirmed),
                );
                return network;
            } catch {}
        }
        return undefined;
    }

    async refresh(network: Network, rootTransactionHash: string): Promise<FileEntity> {
        const service = this.getStorage(network);
        let metadata = await this.refreshS3File(network, rootTransactionHash);
        if (!metadata) {
            metadata = await service.loadMetadataFromHash(rootTransactionHash);
        }
        let file = await this.fileEntityModel.findOne({
            where: { rootTransactionHash: rootTransactionHash },
        });
        if (!file) {
            const creationHeight = Utils.toBigInt(metadata.rootTransaction.transactionInfo!.height!);
            file = await this.fileEntityModel.create({
                network,
                name: metadata.name,
                header: metadata.header,
                size: metadata.size,
                mime: metadata.mime,
                parser: metadata.parser,
                version: metadata.version,
                creationHeight: creationHeight.toString(),
                rootTransactionHash,
            });
        }
        return file;
    }

    async refreshS3File(network: Network, rootTransactionHash: string): Promise<FileMetadataWithTransaction | undefined> {
        const service = this.getStorage(network);
        const s3 = this.configService.get<S3Configuration>('s3');
        const client = new S3Client({
            endpoint: s3.endpoint,
            credentials: {
                accessKeyId: s3.accessKeyId,
                secretAccessKey: s3.secretAccessKey,
            },
        });
        const key = `${s3.bucket}/${rootTransactionHash}`;
        const getObjectCommand = new GetObjectCommand({
            Bucket: s3.bucket,
            Key: key,
        });

        try {
            await client.send(getObjectCommand);
            this.logger.log(`Object with key ${key} does exist!`);
            return undefined;
        } catch (e) {
            this.logger.error(e);
            this.logger.log(`Object with key ${key} does not exist! Storing!`);
            const file = await service.loadFileFromHash(rootTransactionHash);
            this.logger.log(file.content.length);
            const command = new PutObjectCommand({
                Bucket: s3.bucket,
                ContentType: file.metadata.mime,
                Body: file.content,
                Key: key,
            });
            await client.send(command);
            return file.metadata;
        } finally {
            client.destroy();
        }
    }

    private getStorage(network: Network): StorageService {
        const repositoryFactory = this.networkService.getRepositoryFactory(network);
        return new StorageService(repositoryFactory);
    }
}
