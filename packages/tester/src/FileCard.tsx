import { FileMetadataWithTransaction } from 'garush-storage';
import React, { useContext, useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { Account, AggregateTransaction, Mosaic, TransactionType, TransferTransaction } from 'symbol-sdk';
import { ConfigurationContext, Network } from './App';
import BuyButton from './BuyButton';
import FilePanel from './FilePanel';
import ResellButton from './ResellButton';

export default function FileCard({ file, network }: { file: FileMetadataWithTransaction; network: Network }) {
    const hash = file.rootTransaction.transactionInfo?.hash;
    const { repositoryFactory, brokerPrivateKey, networkType } = useContext(ConfigurationContext)[Network.symbol];
    const brokerAccount = Account.createFromPrivateKey(brokerPrivateKey, networkType);
    if (!hash) {
        throw new Error('Root hash must exist!');
    }
    const [soldPrice, setSoldPrice] = useState<number | undefined>(undefined);
    const [serviceFee, setServiceFee] = useState<number | undefined>(undefined);
    useEffect(() => {
        repositoryFactory.getCurrencies().subscribe((currencies) => {
            function getMosaic(t: TransferTransaction): Mosaic | undefined {
                return t.mosaics.find((m) => m.id.equals(currency.unresolvedMosaicId));
            }
            const currency = currencies.currency;
            if (
                file.rootTransaction.type !== TransactionType.AGGREGATE_COMPLETE &&
                file.rootTransaction.type !== TransactionType.AGGREGATE_BONDED
            ) {
                return;
            }

            (file.rootTransaction as AggregateTransaction).innerTransactions.forEach((t) => {
                if (t.type !== TransactionType.TRANSFER) {
                    return false;
                }
                const transfer = t as TransferTransaction;

                const mosaic = getMosaic(transfer);
                if (!mosaic) {
                    return false;
                }
                if (transfer.recipientAddress.equals(brokerAccount.address)) {
                    setServiceFee(mosaic.amount.compact() / Math.pow(10, currency.divisibility));
                } else {
                    setSoldPrice(mosaic.amount.compact() / Math.pow(10, currency.divisibility));
                }
                return true;
            });
        });
    }, [repositoryFactory, file, brokerAccount]);

    const { explorerUrl } = useContext(ConfigurationContext)[network];
    const mosaicId = file.userData?.mosaicId;
    return (
        <Card style={{ width: '24rem' }}>
            <Card.Header>{file.name}</Card.Header>
            <Card.Body>
                <FilePanel metadata={file} network={network} />
            </Card.Body>
            <Card.Body>
                <a target="_blank" href={`/explorer/${network}/${hash}`} rel="noreferrer">
                    Explore File
                </a>
            </Card.Body>
            <Card.Body>
                <a target="_blank" title={`Transaction Hash ${hash}`} href={`${explorerUrl}/transactions/${hash}`} rel="noreferrer">
                    Explore Transaction
                </a>
            </Card.Body>
            {mosaicId ? (
                <Card.Body>
                    <a target="_blank" title={`Mosaic Id ${mosaicId}`} href={`${explorerUrl}/mosaics/${mosaicId}`} rel="noreferrer">
                        Explore Mosaic
                    </a>
                </Card.Body>
            ) : (
                <></>
            )}
            {soldPrice ? <Card.Body>Original selling price was ${soldPrice}</Card.Body> : <></>}
            {serviceFee ? <Card.Body>Original service Fee was ${serviceFee}</Card.Body> : <></>}
            {network === Network.garush ? (
                <Card.Body>
                    <BuyButton rootTransactionHash={hash} />
                </Card.Body>
            ) : (
                <></>
            )}
            {network === Network.symbol ? (
                <Card.Body>
                    <ResellButton rootTransactionHash={hash} />
                </Card.Body>
            ) : (
                <></>
            )}
        </Card>
    );
}
