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
    UInt64,
} from 'symbol-sdk';
import { FileMetadata, StorageService } from './StorageService';

export interface Art {
    creationHeight: UInt64;
    mosaicId: MosaicId;
    rootTransactionHash: string;
    metadata: FileMetadata;
    rootTransaction: AggregateTransaction;
    owner: Address;
}

export class SearchService {
    private storageService: StorageService;
    constructor(private readonly repositoryFactory: RepositoryFactory) {
        this.storageService = new StorageService(repositoryFactory);
    }

    public search({ fromHeight }: { fromHeight?: UInt64 }): Observable<Art> {
        const transactionRepository = this.repositoryFactory.createTransactionRepository();

        console.log('HERE!');
        return transactionRepository
            .streamer()
            .search({
                group: TransactionGroup.Confirmed,
                fromHeight: fromHeight,
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
                            return this.getOwner(mosaicId).pipe(
                                map((a) => {
                                    return {
                                        creationHeight: creationHeight,
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
