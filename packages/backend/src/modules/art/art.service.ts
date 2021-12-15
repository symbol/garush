import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Queue } from 'bull';
import { Art, SearchService, Utils } from 'garush-storage';
import { EMPTY, firstValueFrom, from, isObservable, Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { BackendUtils } from '../../common/backend.utils';
import { Network } from '../../common/network';
import { FileService } from '../file/file.service';
import { NetworkService } from '../network/network.service';
import { ArtEntity, ArtEntityAttributes } from './models/art.entity';
import { ArtRefreshLogEntity } from './models/art.refresh.log.entity';
@Injectable()
export class ArtService {
    private readonly logger = new Logger(ArtService.name);
    constructor(
        @InjectModel(ArtEntity)
        private readonly artEntityModel: typeof ArtEntity,

        @InjectModel(ArtRefreshLogEntity)
        private readonly artRefreshLogEntityModel: typeof ArtRefreshLogEntity,

        @Inject(NetworkService) private readonly networkService: NetworkService,
        @InjectQueue('garush') private queue: Queue,
        @Inject(FileService) private readonly fileService: FileService,
    ) {}

    public async getAll(): Promise<ArtEntity[]> {
        return this.artEntityModel.findAll({ include: [{ all: true }] });
    }

    public async getOne(mosaicId: string): Promise<ArtEntity | undefined> {
        return this.artEntityModel.findOne({ where: { mosaicId: mosaicId } });
    }

    private async createArt(art: Art, network: Network): Promise<ArtEntity> {
        // this.refreshStorage(network, art.rootTransactionHash);
        if (
            !(await this.artEntityModel.findOne({
                where: { mosaicId: art.mosaicId.toHex() },
            }))
        ) {
            const file = await this.fileService.refresh(network, art.rootTransactionHash);
            const royalty = parseInt(art.metadata.userData?.royalty?.toString()) || 0;
            const description = art.metadata.userData?.description?.toString() || '';
            if (!file.id) {
                throw new Error('File.id must defined!!');
            }

            const entity: ArtEntityAttributes = {
                network: network,
                creationHeight: BackendUtils.fromBigInt(art.creationHeight),
                artistAddress: art.artist.plain(),
                ownerAddress: art.owner.plain(),
                mosaicId: art.mosaicId.toHex(),
                description: description,
                royalty: royalty,
                file: file,
                fileId: file.id,
            };
            return await this.artEntityModel.create(entity);
        }
    }

    private refreshStorage(network: Network, rootTransactionHash: string) {
        this.logger.log(`Refreshing storage ${rootTransactionHash}`);
        this.queue.add('refresh_storage', {
            network: network,
            rootTransactionHash: rootTransactionHash,
        });
    }

    async refreshNetworkStorage(network: Network) {
        const entities = await this.artEntityModel.findAll({
            where: { network: network },
            order: [['id', 'DESC']],
        });
        for (const entity of entities) {
            this.refreshStorage(network, entity.file.rootTransactionHash);
        }
    }
    private async getOrCreateCurrentLog(network: Network) {
        const log = await this.artRefreshLogEntityModel.findOne({
            where: { network: network },
            order: [['id', 'DESC']],
        });
        if (log) {
            return log;
        }

        return this.artRefreshLogEntityModel.create({
            network: network,
            toHeight: BigInt(0),
            fromHeight: BigInt(0),
            total: 0,
        });
    }
    async refreshArtGivenNetwork(network: Network) {
        const repositoryFactory = this.networkService.getRepositoryFactory(network);
        const searchService = new SearchService(repositoryFactory);
        const currentLog = await this.getOrCreateCurrentLog(network);
        const fromHeight: bigint = BackendUtils.toBigInt(currentLog.toHeight) + BigInt(1);
        const chainInfo = await firstValueFrom(repositoryFactory.createChainRepository().getChainInfo());
        const height = Utils.toBigInt(chainInfo.height);
        const maxToHeight = fromHeight + BigInt(100000);
        const toHeight = height < maxToHeight ? height : maxToHeight;
        if (toHeight > height) {
            return;
        }
        this.logger.log(`reloading arts ${network}`);
        const artSubscriber: Observable<Art> = await searchService.search({
            fromHeight: fromHeight,
            toHeight: toHeight,
        });

        if (isObservable(artSubscriber)) {
            // I have hacked this with  "rxjs": "file:../storage/node_modules/rxjs",
            console.log('Observable :)');
        } else {
            console.error('NO OBSERVABLE!!');
        }
        let total = 0;

        artSubscriber
            .pipe(
                mergeMap((art: Art) => {
                    const entity = this.createArt(art, network);
                    console.log(typeof entity);
                    if (!entity) {
                        return EMPTY;
                    }
                    return from(entity);
                }),
                tap(() => {
                    total++;
                }),
            )
            .subscribe(
                (entity) => {
                    if (entity) this.logger.log(`ART with mosaicId ${entity.mosaicId} saved!`);
                },
                (e) => {
                    console.log(e);
                    this.logger.error(e);
                },
                () => {
                    this.artRefreshLogEntityModel.create({
                        network: network,
                        toHeight: toHeight,
                        fromHeight: fromHeight,
                        total: total,
                    });
                },
            );
    }
}
