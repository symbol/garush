import * as http from 'http';
import * as https from 'https';
import { toArray } from 'rxjs/operators';
import {
    AggregateTransaction,
    Convert,
    Deadline,
    MetadataType,
    MosaicDefinitionTransaction,
    MosaicFlags,
    MosaicId,
    MosaicInfo,
    MosaicNonce,
    MosaicSupplyChangeAction,
    MosaicSupplyChangeTransaction,
    PlainMessage,
    RepositoryFactory,
    Transaction,
    TransferTransaction,
    UInt64,
} from 'symbol-sdk';
import { ConsoleLogger, PrivateAccountParam, StorageService, StoreFileParams, StoreFileResponse } from './StorageService';

export interface NemberArtMosaicData {
    v: number;
    artistName: string;
    medium: string;
    dimensions: string;
    creationDate: string;
    rarity: string;
    uid: string;
    edition: number;
    totalEditions: number;
}

export interface NemberArtMosaicMetadata {
    data: { meta: { name: string; description: string }; media: { ipfs: string } };
    v: number;
}

interface CreateArtParam {
    garushNetwork: boolean;
    brokerPrivateAccount: PrivateAccountParam;
    artistPrivateAccount: PrivateAccountParam;
    content: Uint8Array;
    name: string;
    description: string;
    mime: string;
    feeMultiplier: number;
    mosaicDuration?: number;
    userData?: Record<string, unknown>;
    logger?: ConsoleLogger;
    nonce?: MosaicNonce;
    extraTransactions?: Transaction[];
    cosignerAccounts?: PrivateAccountParam[];
}

interface BuyArtParam {
    rootTransactionHash: string;
    mosaicDuration: number;
    percentage: number;
    brokerPrivateAccount: PrivateAccountParam;
    artistPrivateAccount: PrivateAccountParam;
    buyerPrivateAccount: PrivateAccountParam;
    feeMultiplier: number;
    price: UInt64;
    logger?: ConsoleLogger;
}

interface ResellArtParam {
    rootTransactionHash: string;
    mosaicDuration: number;
    percentage: number;
    brokerPrivateAccount: PrivateAccountParam;
    ownerPrivateAccount: PrivateAccountParam;
    buyerPrivateAccount: PrivateAccountParam;
    feeMultiplier: number;
    price: UInt64;
    logger?: ConsoleLogger;
}

export class NFTService {
    constructor(private readonly symbolRepositoryFactory: RepositoryFactory, private readonly garushRepositoryFactory: RepositoryFactory) {}

    //http://ngl-dual-601.symbolblockchain.io:3000/transactions/confirmed?type=16724&transferMosaicId=1D6E695EA6C6EA31&embedded=true

    //http://ngl-dual-601.symbolblockchain.io:3000/transactions/confirmed/4EB724BC80F9368F62BA69E0B48F0A80CAB1069B58DE9E56AA8D6D865BD4BDCA

    //500.000000
    //9500.000000
    //https://nember.art/art?id=1D6E695EA6C6EA31

    //1D6E695EA6C6EA31
    //4EF18BE1687BB030
    public async takeNemberArt(mosaicId: MosaicId): Promise<{ matadata: NemberArtMosaicMetadata; mosaic: MosaicInfo }> {
        const mosaicRepository = this.symbolRepositoryFactory.createMosaicRepository();
        const mosaic = await mosaicRepository.getMosaic(mosaicId).toPromise();
        return { mosaic: mosaic, matadata: await this.getMetadata(mosaic) };
    }

    public async getMetadata(mosaic: MosaicInfo): Promise<NemberArtMosaicMetadata> {
        //TODO create composite id if the metadata if possible.
        const metadataRepository = this.symbolRepositoryFactory.createMetadataRepository();
        const searchedMetadata = await metadataRepository
            .streamer()
            .search({
                metadataType: MetadataType.Mosaic,
                targetId: mosaic.id,
                targetAddress: mosaic.ownerAddress,
            })
            .pipe(toArray())
            .toPromise();

        const finalMetadata = searchedMetadata
            .map((m) => {
                try {
                    return JSON.parse(m.metadataEntry.value) as NemberArtMosaicMetadata;
                } catch (e) {
                    try {
                        return JSON.parse(Convert.hexToUtf8(m.metadataEntry.value)) as NemberArtMosaicMetadata;
                    } catch (e) {
                        console.error(e);
                        return undefined;
                    }
                }
            })
            .find((m) => m !== undefined && m.v === 1);
        if (!finalMetadata) {
            throw new Error(`Cannot find metadata for mosaic ${mosaic.id.toHex()}`);
        }
        return finalMetadata;
    }

    public downloadFile(url: string): Promise<{ mime: string; content: Buffer }> {
        return new Promise<{ mime: string; content: Buffer }>((resolve, reject) => {
            (url.toLowerCase().startsWith('https:') ? https : http)
                .get(url, (res) => {
                    const mime = res.headers['content-type'];
                    if (!mime) {
                        return reject(new Error('Mime type cannot be resolved!'));
                    } else {
                        const buffers: Uint8Array[] = [];
                        res.on('error', (err) => reject(err));
                        res.on('data', (chunk) => {
                            buffers.push(chunk);
                        }).on('end', () => {
                            const buffer = Buffer.concat(buffers);
                            return resolve({ mime, content: buffer });
                        });
                    }
                })
                .on('error', (err) => reject(err));
        });
    }

    public async createArt(params: CreateArtParam): Promise<StoreFileResponse> {
        const logger = params.logger || new ConsoleLogger();
        const repositoryFactory = params.garushNetwork ? this.garushRepositoryFactory : this.symbolRepositoryFactory;
        const epochAdjustment = await repositoryFactory.getEpochAdjustment().toPromise();
        const deadline = Deadline.create(epochAdjustment);
        const networkType = await repositoryFactory.getNetworkType().toPromise();
        const artistAccount = StorageService.getAccount(params.artistPrivateAccount, networkType);
        const brokerAccount = StorageService.getAccount(params.brokerPrivateAccount, networkType);
        const flags = MosaicFlags.create(false, true, false);
        const storageService = new StorageService(repositoryFactory);
        const storeFileParams: StoreFileParams = {
            ...params,
            logger: logger,
            signerPrivateAccount: brokerAccount.privateKey,
            recipientPublicAccount: artistAccount.publicAccount,
            extraTransactions: [],
            cosignerAccounts: [],
            userData: { description: params.description },
        };
        const mosaicDuration = params.mosaicDuration;
        if (storeFileParams.extraTransactions == undefined) {
            throw new Error('storeFileParams.extraTransactions must not be undefined!');
        }
        if (storeFileParams.cosignerAccounts == undefined) {
            throw new Error('storeFileParams.cosignerAccounts must not be undefined!');
        }
        if (mosaicDuration !== undefined) {
            const nonce = params.nonce || MosaicNonce.createRandom();
            const mosaicId = MosaicId.createFromNonce(nonce, brokerAccount.address);
            logger.log(`Creating mosaic ${mosaicId.toHex()} with duration of ${mosaicDuration || 'Infinite'}`);
            const maxMosaicDuration = UInt64.fromUint(mosaicDuration);
            const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
                deadline,
                nonce,
                mosaicId,
                flags,
                0,
                maxMosaicDuration,
                networkType,
            ).toAggregate(brokerAccount.publicAccount);

            const mosaicSupplyTransaction = MosaicSupplyChangeTransaction.create(
                deadline,
                mosaicId,
                MosaicSupplyChangeAction.Increase,
                UInt64.fromUint(1),
                networkType,
            ).toAggregate(brokerAccount.publicAccount);
            storeFileParams.extraTransactions.push(mosaicDefinitionTransaction, mosaicSupplyTransaction);
            storeFileParams.userData = { ...storeFileParams.userData, mosaicId: mosaicId.toHex() };
        }
        if (params.extraTransactions) {
            storeFileParams.extraTransactions.push(...params.extraTransactions);
        }
        if (params.cosignerAccounts) {
            storeFileParams.cosignerAccounts.push(...params.cosignerAccounts);
        }
        return storageService.storeFile(storeFileParams);
    }

    public async sellArt(params: BuyArtParam): Promise<StoreFileResponse> {
        const logger = params.logger || new ConsoleLogger();
        const repositoryFactory = this.symbolRepositoryFactory;
        const { currency } = await repositoryFactory.getCurrencies().toPromise();
        const networkType = await repositoryFactory.getNetworkType().toPromise();
        const nonce = MosaicNonce.createRandom();
        const artistAccount = StorageService.getAccount(params.artistPrivateAccount, networkType);
        const buyerAccount = StorageService.getAccount(params.buyerPrivateAccount, networkType);
        const brokerAccount = StorageService.getAccount(params.brokerPrivateAccount, networkType);
        const mosaicId = MosaicId.createFromNonce(nonce, brokerAccount.address);
        const file = await new StorageService(this.garushRepositoryFactory).loadImageFromHash(params.rootTransactionHash);
        const epochAdjustment = await repositoryFactory.getEpochAdjustment().toPromise();
        const deadline = Deadline.create(epochAdjustment);

        logger.log(
            `Creating nft art transfer from broker ${brokerAccount.address.plain()} to buyer ${buyerAccount.address.plain()}. Mosaic ${mosaicId.toHex()}. Fee Multiplier ${
                params.feeMultiplier
            }`,
        );
        const nftTransfer = TransferTransaction.create(
            deadline,
            buyerAccount.address,
            [
                {
                    id: mosaicId,
                    amount: UInt64.fromUint(1),
                },
            ],
            PlainMessage.create(`Transfer nft art from broker ${brokerAccount.address.plain()} to buyer ${buyerAccount.address.plain()}`),
            networkType,
        ).toAggregate(brokerAccount.publicAccount);
        const percentage = params.percentage;

        logger.log(
            `Creating ${percentage}% Fee payment from buyer ${buyerAccount.address.plain()} to broker ${brokerAccount.address.plain()}`,
        );
        const feeTransfer = TransferTransaction.create(
            deadline,
            brokerAccount.address,
            [
                {
                    id: currency.unresolvedMosaicId,
                    amount: UInt64.fromUint((params.price.compact() / 100) * percentage),
                },
            ],
            PlainMessage.create(
                `${percentage}% Fee payment from buyer ${buyerAccount.address.plain()} to broker ${brokerAccount.address.plain()}`,
            ),
            networkType,
        ).toAggregate(buyerAccount.publicAccount);

        logger.log(
            `Creating selling price transfer from buyer ${buyerAccount.address.plain()} to to artist ${artistAccount.address.plain()}`,
        );
        const priceTransfer = TransferTransaction.create(
            deadline,
            artistAccount.address,
            [
                {
                    id: currency.unresolvedMosaicId,
                    amount: params.price,
                },
            ],

            PlainMessage.create(
                `Selling price payment from buyer ${buyerAccount.address.plain()} to to artist ${artistAccount.address.plain()}`,
            ),
            networkType,
        ).toAggregate(buyerAccount.publicAccount);

        return this.createArt({
            garushNetwork: false,
            ...params,
            nonce: nonce,
            description: file.metadata.userData?.description?.toString() || '',
            name: file.metadata.name,
            content: file.content,
            mime: file.metadata.mime,
            extraTransactions: [nftTransfer, feeTransfer, priceTransfer],
            cosignerAccounts: [buyerAccount],
        });
    }

    public async resellArt(params: ResellArtParam): Promise<void> {
        const logger = params.logger || new ConsoleLogger();
        const repositoryFactory = this.symbolRepositoryFactory;
        const { currency } = await repositoryFactory.getCurrencies().toPromise();
        const networkType = await repositoryFactory.getNetworkType().toPromise();
        const ownerAccount = StorageService.getAccount(params.ownerPrivateAccount, networkType);
        const buyerAccount = StorageService.getAccount(params.buyerPrivateAccount, networkType);
        const brokerAccount = StorageService.getAccount(params.brokerPrivateAccount, networkType);
        const file = await new StorageService(repositoryFactory).loadMetadataFromHash(params.rootTransactionHash);
        const epochAdjustment = await repositoryFactory.getEpochAdjustment().toPromise();
        const generationHash = await repositoryFactory.getGenerationHash().toPromise();
        const deadline = Deadline.create(epochAdjustment);
        if (!file.userData?.mosaicId) {
            throw new Error(`There is no mosaic id on file ${params.rootTransactionHash}`);
        }
        const mosaicId = new MosaicId(file.userData.mosaicId.toString());

        logger.log(
            `Creating nft art transfer from owner ${ownerAccount.address.plain()} to buyer ${buyerAccount.address.plain()}. Mosaic ${mosaicId.toHex()}. Fee Multiplier ${
                params.feeMultiplier
            }`,
        );
        const nftTransfer = TransferTransaction.create(
            deadline,
            buyerAccount.address,
            [
                {
                    id: mosaicId,
                    amount: UInt64.fromUint(1),
                },
            ],
            PlainMessage.create(`Transfer nft art from owner ${ownerAccount.address.plain()} to buyer ${buyerAccount.address.plain()}`),
            networkType,
        ).toAggregate(ownerAccount.publicAccount);
        const percentage = params.percentage;

        logger.log(
            `Creating ${percentage}% Fee payment from buyer ${buyerAccount.address.plain()} to broker ${brokerAccount.address.plain()}`,
        );
        const feeTransfer = TransferTransaction.create(
            deadline,
            brokerAccount.address,
            [
                {
                    id: currency.unresolvedMosaicId,
                    amount: UInt64.fromUint((params.price.compact() / 100) * percentage),
                },
            ],
            PlainMessage.create(
                `${percentage}% Fee payment from buyer ${buyerAccount.address.plain()} to broker ${brokerAccount.address.plain()}`,
            ),
            networkType,
        ).toAggregate(buyerAccount.publicAccount);

        logger.log(
            `Creating selling price transfer from buyer ${buyerAccount.address.plain()} to to owner ${ownerAccount.address.plain()}`,
        );
        const priceTransfer = TransferTransaction.create(
            deadline,
            ownerAccount.address,
            [
                {
                    id: currency.unresolvedMosaicId,
                    amount: params.price,
                },
            ],

            PlainMessage.create(
                `Selling price payment from buyer ${buyerAccount.address.plain()} to to artist ${ownerAccount.address.plain()}`,
            ),
            networkType,
        ).toAggregate(buyerAccount.publicAccount);

        const aggregate = AggregateTransaction.createComplete(
            deadline,
            [nftTransfer, feeTransfer, priceTransfer],
            networkType,
            [],
        ).setMaxFeeForAggregate(params.feeMultiplier, 1);

        const storageService = new StorageService(repositoryFactory);
        await storageService.announceAll(
            [buyerAccount.signTransactionWithCosignatories(aggregate, [ownerAccount], generationHash)],
            true,
            logger,
        );
    }
}
