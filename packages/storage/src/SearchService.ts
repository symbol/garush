import { EMPTY, Observable } from 'rxjs';
import { map, mergeMap, take } from 'rxjs/operators';
import {
    AccountInfo,
    Address,
    AggregateTransaction,
    AggregateTransactionInfo,
    MosaicDefinitionTransaction,
    MosaicId,
    RepositoryFactory,
    TransactionGroup,
    TransactionType,
    TransferTransaction,
} from 'symbol-sdk';
import { FileMetadata, StorageService } from './StorageService';
import { Utils } from './Utils';

export interface Art {
    creationHeight: bigint;
    mosaicId: MosaicId;
    rootTransactionHash: string;
    metadata: FileMetadata;
    rootTransaction: AggregateTransaction;
    artist: Address;
    owner: Address;
}

export interface SearchCriteria {
    fromHeight?: bigint;
    toHeight?: bigint;
}

export class SearchService {
    private storageService: StorageService;
    constructor(private readonly repositoryFactory: RepositoryFactory) {
        this.storageService = new StorageService(repositoryFactory);
    }

    public search({ fromHeight, toHeight }: SearchCriteria): Observable<Art> {
        const transactionRepository = this.repositoryFactory.createTransactionRepository();
        return transactionRepository
            .streamer()
            .search({
                group: TransactionGroup.Confirmed,
                fromHeight: Utils.fromOptionalBigInt(fromHeight),
                toHeight: Utils.fromOptionalBigInt(toHeight),
                type: [TransactionType.MOSAIC_DEFINITION],
                embedded: true,
            })

            .pipe(
                mergeMap((m) => {
                    const mosaicDefinition = m as MosaicDefinitionTransaction;
                    const possibleMosaic = mosaicDefinition.divisibility == 0 && mosaicDefinition.flags.transferable;
                    if (!mosaicDefinition.transactionInfo || !possibleMosaic) {
                        return EMPTY;
                    }
                    const aggregateHash = (mosaicDefinition.transactionInfo as AggregateTransactionInfo)?.aggregateHash;
                    if (!aggregateHash) {
                        return EMPTY;
                    }
                    const mosaicId = mosaicDefinition.mosaicId;
                    return transactionRepository.getTransaction(aggregateHash, TransactionGroup.Confirmed).pipe(
                        mergeMap((a) => {
                            const aggregateTransaction = a as AggregateTransaction;
                            if (!aggregateTransaction.transactionInfo) {
                                return EMPTY;
                            }
                            const creationHeight = aggregateTransaction.transactionInfo.height;
                            if (!creationHeight) {
                                return EMPTY;
                            }
                            const metadata = this.storageService.getMetadata(aggregateTransaction);
                            if (!metadata) {
                                return EMPTY;
                            }
                            const artist = (aggregateTransaction.innerTransactions[0] as TransferTransaction).signer!.address;
                            return this.getOwner(mosaicId).pipe(
                                map((a) => {
                                    return {
                                        creationHeight: Utils.toBigInt(creationHeight),
                                        artist: artist,
                                        owner: a.address,
                                        metadata: metadata,
                                        mosaicId: mosaicId,
                                        rootTransactionHash: aggregateHash,
                                        rootTransaction: aggregateTransaction,
                                    };
                                }),
                            );
                        }),
                    );
                }),
            );
    }
    private getOwner(mosaicId: MosaicId): Observable<AccountInfo> {
        const accountRepository = this.repositoryFactory.createAccountRepository();
        return accountRepository.streamer().search({ mosaicId: mosaicId }).pipe(take(1));
    }
}
