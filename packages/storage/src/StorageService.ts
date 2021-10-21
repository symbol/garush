import * as _ from 'lodash';
import { EMPTY, Observable, of } from 'rxjs';
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
    header?: Record<string, unknown>;
    userData?: Record<string, unknown>;
}

export interface Logger {
    log(message: string): void;
}

export class ConsoleLogger implements Logger {
    log(message: string): void {
        console.log(message);
    }
}

export type PublicAccountParam = string | PublicAccount | Address;
export type PrivateAccountParam = string | Account;

interface StoreImageParams {
    signerPrivateAccount: PrivateAccountParam;
    recipientPublicAccount: PublicAccountParam;
    content: Uint8Array;
    name: string;
    mime: string;
    userData?: Record<string, unknown>;
    feeMultiplier?: number;
    logger?: ConsoleLogger;
}

export class StorageService {
    private readonly fileParserManager = new FileParserManager();

    constructor(private readonly repositoryFactory: RepositoryFactory) {}

    public async storeImage({
        signerPrivateAccount,
        recipientPublicAccount,
        content,
        name,
        mime,
        feeMultiplier = 1000,
        userData,
        logger = new ConsoleLogger(),
    }: StoreImageParams): Promise<{ metadata: FileMetadata; rootTransactionHash: string }> {
        const epochAdjustment = await this.repositoryFactory.getEpochAdjustment().toPromise();
        const deadline = Deadline.create(epochAdjustment);
        const generationHash = await this.repositoryFactory.getGenerationHash().toPromise();
        const networkType = await this.repositoryFactory.getNetworkType().toPromise();
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
            logger,
        );
        const rootTransaction = signerAccount.sign(metadataTransaction, generationHash);
        logger?.log(`Root  transaction ${rootTransaction.hash} signed`);
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
        logger?: Logger,
    ): TransferTransaction | AggregateTransaction {
        const metadata = YamlUtils.toYaml(fileMetadata);
        const metadataMessage = PlainMessage.create(metadata);

        if (metadataMessage.toBuffer().length > 1024) {
            const { hashes, ...rest } = fileMetadata;
            const metadataWithoutHashes = YamlUtils.toYaml(rest);
            const metadataMessageWithoutHashes = PlainMessage.create(metadataWithoutHashes);
            const hashesSplit = _.chunk(Convert.hexToUint8(hashes.join('')), 1024);
            const transferTransaction = TransferTransaction.create(
                deadline,
                recipientAddress,
                [],
                metadataMessageWithoutHashes,
                networkType,
            );
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
            const aggregate = AggregateTransaction.createComplete(
                deadline,
                innerTransactions.map((t) => t.toAggregate(signerAccount)),
                networkType,
                [],
            );

            logger?.log(`Created aggregate root transaction transaction with ${aggregate.innerTransactions.length} inner transactions`);
            return aggregate.setMaxFeeForAggregate(feeMultiplier, 0);
        } else {
            const transferTransaction = TransferTransaction.create(deadline, recipientAddress, [], metadataMessage, networkType);

            logger?.log(`Created transfer root transaction transaction`);
            return transferTransaction.setMaxFee(feeMultiplier) as TransferTransaction;
        }
    }

    public async loadImagesMetadata(
        addressParam: PublicAccountParam,
    ): Promise<{ metadata: FileMetadata; rootTransaction: TransferTransaction | AggregateTransaction }[]> {
        const networkType = await this.repositoryFactory.getNetworkType().toPromise();
        const address = StorageService.getAddress(addressParam, networkType);
        const transactionRepository = this.repositoryFactory.createTransactionRepository();

        return transactionRepository
            .streamer()
            .search({
                group: TransactionGroup.Confirmed,
                type: [TransactionType.TRANSFER],
                recipientAddress: address,
                embedded: true,
                order: Order.Desc,
            })
            .pipe(
                mergeMap<Transaction, Observable<TransferTransaction | AggregateTransaction>>((t) => {
                    return this.loadTransaction(t as TransferTransaction, transactionRepository);
                }),
                mergeMap((t) => {
                    const rootTransaction = t as TransferTransaction | AggregateTransaction;
                    const metadata = this.getMetadata(rootTransaction);
                    if (!metadata) {
                        return EMPTY;
                    } else {
                        return of({ metadata, rootTransaction });
                    }
                }),
                toArray(),
            )
            .toPromise();
    }

    private loadTransaction(
        t: TransferTransaction,
        transactionRepository: TransactionRepository,
    ): Observable<TransferTransaction | AggregateTransaction> {
        if (t.type != TransactionType.TRANSFER) {
            throw new Error('Invalid transaction type!');
        }
        const metadata = this.getMetadata(t);
        if (!metadata) {
            return of();
        }
        const aggregateHash = (t.transactionInfo as AggregateTransactionInfo)?.aggregateHash;
        if (aggregateHash) {
            return transactionRepository
                .getTransaction(aggregateHash, TransactionGroup.Confirmed)
                .pipe(map((t) => t as AggregateTransaction));
        }
        return of(t);
    }

    public async loadImageFromHash(
        transactionHash: string,
    ): Promise<{ metadata: FileMetadata; content: Uint8Array; dataTransactionsTotalSize: number }> {
        const metadata = await this.loadMetadataFromHash(transactionHash);
        return this.loadImageFromMetadata(metadata);
    }

    public async loadMetadataFromHash(transactionHash: string): Promise<FileMetadata> {
        const transactionRepository = this.repositoryFactory.createTransactionRepository();
        const transactionRoot = (await transactionRepository.getTransaction(transactionHash, TransactionGroup.Confirmed).toPromise()) as
            | TransferTransaction
            | AggregateTransaction;

        const metadata = this.getMetadata(transactionRoot);
        if (!metadata) {
            throw new Error(`Transaction ${transactionHash} is not a root garush transaction!`);
        }
        return metadata;
    }

    public async loadImageFromMetadata(
        metadata: FileMetadata,
    ): Promise<{ metadata: FileMetadata; content: Uint8Array; dataTransactionsTotalSize: number }> {
        const fileParser = this.fileParserManager.getFileParser(metadata.parser);
        const transactionRepository = this.repositoryFactory.createTransactionRepository();
        const aggregateTransactions = (
            await Promise.all(
                metadata.hashes.map((hash) => {
                    return transactionRepository.getTransaction(hash, TransactionGroup.Confirmed).toPromise();
                }),
            )
        ).map((a) => a as AggregateTransaction);
        const dataTransactionsTotalSize = _.sumBy(aggregateTransactions, (a) => a.size);
        const content = await this.getContent(aggregateTransactions, fileParser);
        return { metadata, content, dataTransactionsTotalSize };
    }

    private getContent(aggregateTransactions: AggregateTransaction[], fileParser: FileParser): Promise<Uint8Array> {
        const chunks = _.map(aggregateTransactions, (aggregate) =>
            (aggregate.innerTransactions as TransferTransaction[]).map((t) => {
                return t.message.toBuffer();
            }),
        );
        return fileParser.join(chunks);
    }

    public getMetadata(transactionRoot: TransferTransaction | AggregateTransaction): FileMetadata | undefined {
        if (transactionRoot.type == TransactionType.TRANSFER) {
            const transferTransactionRoot = transactionRoot as TransferTransaction;
            try {
                const metadata = YamlUtils.fromYaml(transferTransactionRoot.message.payload) as FileMetadata;
                if (metadata.type != 'garush') {
                    return undefined;
                }
                return metadata;
            } catch (e) {
                console.error('Cannot load metadata!', e);
                return undefined;
            }
        } else {
            const aggregateTransactionRoot = transactionRoot as AggregateTransaction;
            try {
                const innerTransactions = aggregateTransactionRoot.innerTransactions as TransferTransaction[];
                const metadata = YamlUtils.fromYaml(innerTransactions[0].message.payload) as FileMetadata;
                if (metadata.type != 'garush') {
                    return undefined;
                }
                const hashes = innerTransactions
                    .slice(1)
                    .map((t) => t.message.toDTO())
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
                logger.log(`Announcing transaction ${signedTransaction.hash}`);
                await transactionService.announce(signedTransaction, listener).toPromise();
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

    public static getAddress(publicAccountParam: PublicAccountParam, networkType: NetworkType): Address {
        if (typeof publicAccountParam === 'string')
            return Convert.isHexString(publicAccountParam, 64)
                ? PublicAccount.createFromPublicKey(publicAccountParam, networkType).address
                : Address.createFromRawAddress(publicAccountParam);
        const address = (publicAccountParam as PublicAccount).address || (publicAccountParam as Address);
        return Address.createFromRawAddress(address.plain());
    }
    public static getAccount(privateAccountParam: PrivateAccountParam, networkType: NetworkType): Account {
        if (typeof privateAccountParam === 'string') return Account.createFromPrivateKey(privateAccountParam, networkType);
        return privateAccountParam;
    }
}
