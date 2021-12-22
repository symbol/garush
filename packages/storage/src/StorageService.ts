import * as _ from 'lodash';
import { EMPTY, firstValueFrom, Observable, of } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import {
    Account,
    Address,
    AggregateTransaction,
    AggregateTransactionInfo,
    Convert,
    Deadline,
    NetworkType,
    Order,
    PlainMessage,
    PublicAccount,
    RawMessage,
    RepositoryFactory,
    SignedTransaction,
    Transaction,
    TransactionGroup,
    TransactionRepository,
    TransactionService,
    TransactionType,
    TransferTransaction,
} from 'symbol-sdk';
import { HeaderType } from './HeaderType';
import { ConsoleLogger, Logger } from './logger';
import { FileParser, FileParserManager, SplitResult } from './parser';
import { Utils } from './Utils';
import { YamlUtils } from './YamlUtils';

export interface FileMetadata {
    type: string;
    version: number;
    name: string;
    parser: string;
    size: number;
    mime: string;
    hashes: string[];
    header?: Record<string, HeaderType>;
    userData?: Record<string, HeaderType>;
}

export interface FileMetadataWithTransaction extends FileMetadata {
    rootTransaction: AggregateTransaction;
}

export type PublicAddressParam = string | PublicAccount | Address;
export type PublicAccountParam = string | PublicAccount;
export type PrivateAccountParam = string | Account;

export interface StoreFileParams {
    signerPrivateAccount: PrivateAccountParam;
    recipientPublicAccount: PublicAccountParam;
    cosignerAccounts?: PrivateAccountParam[];
    content: Uint8Array;
    name: string;
    mime: string;
    userData?: Record<string, HeaderType>;
    feeMultiplier: number;
    logger?: Logger;
    extraTransactions?: Transaction[];
}

export interface StoreFileResponse {
    metadata: FileMetadata;
    rootTransactionHash: string;
}

export class StorageService {
    private readonly fileParserManager = new FileParserManager();

    constructor(private readonly repositoryFactory: RepositoryFactory) {}

    public async storeFile({
        signerPrivateAccount,
        recipientPublicAccount,
        content,
        name,
        mime,
        feeMultiplier,
        userData,
        cosignerAccounts = [],
        extraTransactions = [],
        logger = new ConsoleLogger(),
    }: StoreFileParams): Promise<StoreFileResponse> {
        const epochAdjustment = await firstValueFrom(this.repositoryFactory.getEpochAdjustment());
        const deadline = Deadline.create(epochAdjustment);
        const generationHash = await firstValueFrom(this.repositoryFactory.getGenerationHash());
        const networkType = await firstValueFrom(this.repositoryFactory.getNetworkType());
        logger?.log(`Splitting file size ${content.length}`);
        const fileMimeType = mime;
        const { parser, multiLevelChunks, header } = await this.split(content, mime, logger);
        const signerAccount = StorageService.getAccount(signerPrivateAccount, networkType);
        const recipientAddress = StorageService.getAddress(recipientPublicAccount, networkType);
        const dataRecipientAddress = signerAccount.address;
        const aggregates = multiLevelChunks.map((chunks) => {
            const innerTransactions: TransferTransaction[] = chunks.map((chunk) => {
                const payload = Uint8Array.from(chunk);
                return TransferTransaction.create(deadline, dataRecipientAddress, [], RawMessage.create(payload), networkType);
            });
            const aggregate = AggregateTransaction.createComplete(
                deadline,
                innerTransactions.map((t) => t.toAggregate(signerAccount.publicAccount)),
                networkType,
                [],
            );
            logger?.log(`Created aggregate with ${innerTransactions.length} transfer transactions`);
            return aggregate.setMaxFeeForAggregate(feeMultiplier, 0);
        });
        logger?.log(`Created ${aggregates.length} data aggregate transactions`);

        const aggregateContent = await this.getContent(aggregates, parser);
        if (!Utils.arraysEqual(aggregateContent, content)) {
            //sanity check
            throw new Error('Invalid aggregate content!');
        }

        const signedTransactions = aggregates.map((aggregate) => signerAccount.sign(aggregate, generationHash));

        const fileMetadata: FileMetadata = {
            type: 'garush',
            version: 1,
            name: name,
            size: content.length,
            parser: parser.name,
            mime: fileMimeType,
            hashes: signedTransactions.map((t) => t.hash),
            header: header,
            userData: userData,
        };
        const metadataTransaction = this.createRootTransaction(
            fileMetadata,
            deadline,
            signerAccount.publicAccount,
            recipientAddress,
            dataRecipientAddress,
            networkType,
            feeMultiplier,
            extraTransactions,
            cosignerAccounts?.length,
            logger,
        );
        const rootTransaction = signerAccount.signTransactionWithCosignatories(
            metadataTransaction,
            cosignerAccounts.map((c) => StorageService.getAccount(c, networkType)),
            generationHash,
        );
        logger?.log(`Root transaction ${rootTransaction.hash} signed`);
        if (true) {
            // For speed, all in parallel
            await this.announceAll([...signedTransactions, rootTransaction], true, logger);
        } else {
            await this.announceAll(signedTransactions, true, logger);
            await this.announceAll([rootTransaction], false, logger);
        }

        logger?.log(`All transaction have been confirmed. Use root transaction hash ${rootTransaction.hash} as the file id`);
        return { metadata: fileMetadata, rootTransactionHash: rootTransaction.hash };
    }

    private async split(content: Uint8Array, mime: string, logger?: Logger): Promise<{ parser: FileParser } & SplitResult> {
        const parser = this.fileParserManager.getFileParserFromMimeType(mime);
        try {
            logger?.log(`Parser ${parser.name} resolved from mime type ${mime}`);
            const result = await parser.split(content);
            return { parser, ...result };
        } catch (e) {
            logger?.log(`Parser ${parser.name} failed to split. Falling back to default parser. Error: ${Utils.getMessageFromError(e)}`);
            const fallbackParser = this.fileParserManager.getFileParser(undefined);
            logger?.log(`Parser ${fallbackParser.name} resolved`);
            const result = await fallbackParser.split(content);
            return { parser: fallbackParser, ...result };
        }
    }

    private createRootTransaction(
        fileMetadata: FileMetadata,
        deadline: Deadline,
        signerAccount: PublicAccount,
        recipientAddress: Address,
        dataRecipientAddress: Address,
        networkType: NetworkType,
        feeMultiplier: number,
        extraTransactions: Transaction[],
        requiredCosignatures: number,
        logger?: Logger,
    ): AggregateTransaction {
        const { hashes, ...rest } = fileMetadata;
        const metadataWithoutHashes = YamlUtils.toYaml(rest);
        const metadataMessageWithoutHashes = PlainMessage.create(metadataWithoutHashes);
        const hashesSplit = _.chunk(Convert.hexToUint8(hashes.join('')), 1024);
        const transferTransaction = TransferTransaction.create(deadline, recipientAddress, [], metadataMessageWithoutHashes, networkType);
        const innerTransactions = [
            transferTransaction,
            ...hashesSplit.map((hashes) => {
                return TransferTransaction.create(
                    deadline,
                    dataRecipientAddress,
                    [],
                    RawMessage.create(Uint8Array.from(hashes)),
                    networkType,
                );
            }),
        ];
        extraTransactions.forEach((t) => {
            logger?.log(`Adding ${t.constructor.name} type ${t.type} added to aggregate transactions`);
        });
        const aggregate = AggregateTransaction.createComplete(
            deadline,
            [...innerTransactions.map((t) => t.toAggregate(signerAccount)), ...extraTransactions],
            networkType,
            [],
        );

        logger?.log(`Created aggregate root transaction transaction with ${aggregate.innerTransactions.length} inner transactions`);
        return aggregate.setMaxFeeForAggregate(feeMultiplier, requiredCosignatures);
    }

    public async loadFilesMetadata(addressParam: PublicAddressParam): Promise<FileMetadataWithTransaction[]> {
        const networkType = await firstValueFrom(this.repositoryFactory.getNetworkType());
        const address = StorageService.getAddress(addressParam, networkType);
        const transactionRepository = this.repositoryFactory.createTransactionRepository();

        return firstValueFrom(
            transactionRepository
                .streamer()
                .search({
                    group: TransactionGroup.Confirmed,
                    type: [TransactionType.TRANSFER],
                    recipientAddress: address,
                    embedded: true,
                    order: Order.Desc,
                })
                .pipe(
                    mergeMap<Transaction, Observable<AggregateTransaction>>((t) => {
                        return this.loadRootTransaction(t as TransferTransaction, transactionRepository);
                    }),
                    mergeMap((t) => {
                        const rootTransaction = t as AggregateTransaction;
                        const metadata = this.getMetadata(rootTransaction);
                        if (!metadata) {
                            return EMPTY;
                        } else {
                            return of({ ...metadata, rootTransaction });
                        }
                    }),
                    toArray(),
                ),
        );
    }

    private loadRootTransaction(t: Transaction, transactionRepository: TransactionRepository): Observable<AggregateTransaction> {
        const aggregateHash = (t.transactionInfo as AggregateTransactionInfo)?.aggregateHash;
        if (aggregateHash) {
            return transactionRepository
                .getTransaction(aggregateHash, TransactionGroup.Confirmed)
                .pipe(map((t) => t as AggregateTransaction));
        } else {
            throw new Error('Cannot load parent transaction hash from transaction');
        }
    }

    public async loadFileFromHash(
        transactionHash: string,
    ): Promise<{ metadata: FileMetadataWithTransaction; content: Uint8Array; dataTransactionsTotalSize: number }> {
        const metadata = await this.loadMetadataFromHash(transactionHash);
        const file = await this.loadFileFromMetadata(metadata);
        return { metadata, ...file };
    }

    public async loadMetadataFromHash(transactionHash: string): Promise<FileMetadataWithTransaction> {
        const transactionRepository = this.repositoryFactory.createTransactionRepository();
        const rootTransaction = (await firstValueFrom(
            transactionRepository.getTransaction(transactionHash, TransactionGroup.Confirmed),
        )) as AggregateTransaction;

        const metadata = this.getMetadata(rootTransaction);
        if (!metadata) {
            throw new Error(`Transaction ${transactionHash} is not a root garush transaction!`);
        }
        return { ...metadata, rootTransaction };
    }

    public async loadFileFromMetadata<M extends FileMetadata>(
        metadata: FileMetadata,
    ): Promise<{ content: Uint8Array; dataTransactionsTotalSize: number }> {
        const fileParser = this.fileParserManager.getFileParser(metadata.parser);
        const transactionRepository = this.repositoryFactory.createTransactionRepository();
        const aggregateTransactions = (
            await Promise.all(
                metadata.hashes.map((hash) => {
                    return firstValueFrom(transactionRepository.getTransaction(hash, TransactionGroup.Confirmed));
                }),
            )
        ).map((a) => a as AggregateTransaction);
        const dataTransactionsTotalSize = _.sumBy(aggregateTransactions, (a) => a.size);
        const content = await this.getContent(aggregateTransactions, fileParser);
        return { content, dataTransactionsTotalSize };
    }

    private getContent(aggregateTransactions: AggregateTransaction[], fileParser: FileParser): Promise<Uint8Array> {
        const chunks = _.map(aggregateTransactions, (aggregate) =>
            (aggregate.innerTransactions as TransferTransaction[]).map((t) => {
                return t.message.toBuffer();
            }),
        );
        return fileParser.join(chunks);
    }

    public getMetadata(rootTransaction: Transaction): FileMetadata | undefined {
        if (rootTransaction.type != TransactionType.AGGREGATE_BONDED && rootTransaction.type != TransactionType.AGGREGATE_COMPLETE) {
            throw new Error(`Root transaction must be an aggregate bonded or complete but got ${rootTransaction.type}!`);
        } else {
            const aggregateTransactionRoot = rootTransaction as AggregateTransaction;
            try {
                const innerTransactions = aggregateTransactionRoot.innerTransactions;
                const metadataTransferTransaction = innerTransactions[0] as TransferTransaction;
                if (!metadataTransferTransaction.message) {
                    return undefined;
                }
                const metadata = YamlUtils.fromYaml(metadataTransferTransaction.message.payload) as FileMetadata;
                if (!metadata || metadata.type != 'garush') {
                    return undefined;
                }
                const hashes = _.takeWhile(innerTransactions.slice(1), (t) => t.type === TransactionType.TRANSFER)
                    .map((t) => (t as TransferTransaction).message.toDTO())
                    .join('');
                metadata.hashes = hashes.match(/.{1,64}/g) as string[];
                return metadata;
            } catch (e) {
                console.error('Cannot load metadata!', e);
                return undefined;
            }
        }
    }

    public async announceAll(allSignedTransactions: SignedTransaction[], parallel = false, logger = new ConsoleLogger()): Promise<void> {
        const listener = this.repositoryFactory.createListener();
        const transactionService = new TransactionService(
            this.repositoryFactory.createTransactionRepository(),
            this.repositoryFactory.createReceiptRepository(),
        );
        const basicAnnounce = async (signedTransaction: SignedTransaction) => {
            try {
                listener
                    .status(PublicAccount.createFromPublicKey(signedTransaction.signerPublicKey, signedTransaction.networkType).address)
                    .subscribe((t) => {
                        logger.log(`There has been an error ${JSON.stringify(t, null, 2)}`);
                    });
                logger.log(`Announcing transaction ${signedTransaction.hash}`);
                await firstValueFrom(transactionService.announce(signedTransaction, listener));
                logger.log(`Transaction ${signedTransaction.hash} confirmed`);
            } catch (e) {
                console.error(e);
                throw new Error(`Transaction ${signedTransaction.hash} error: ${e}`);
            }
        };
        try {
            await listener.open();
            if (parallel) {
                await Promise.all(allSignedTransactions.map(basicAnnounce));
            } else {
                for (const signedTransaction of allSignedTransactions) {
                    await basicAnnounce(signedTransaction);
                }
            }
        } finally {
            listener.close();
        }
    }

    public static getAddress(publicAccountParam: PublicAddressParam, networkType: NetworkType): Address {
        if (typeof publicAccountParam === 'string')
            return Convert.isHexString(publicAccountParam, 64)
                ? PublicAccount.createFromPublicKey(publicAccountParam, networkType).address
                : Address.createFromRawAddress(publicAccountParam);
        const address = (publicAccountParam as PublicAccount).address || (publicAccountParam as Address);
        return Address.createFromRawAddress(address.plain());
    }

    public static getPublicAccount(publicAccountParam: PublicAccountParam, networkType: NetworkType): PublicAccount {
        if (typeof publicAccountParam === 'string') return PublicAccount.createFromPublicKey(publicAccountParam, networkType);
        return publicAccountParam;
    }
    public static getAccount(privateAccountParam: PrivateAccountParam, networkType: NetworkType): Account {
        if (typeof privateAccountParam === 'string') return Account.createFromPrivateKey(privateAccountParam, networkType);
        return privateAccountParam;
    }
}
