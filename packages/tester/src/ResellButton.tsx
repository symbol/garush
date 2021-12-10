import React, { useContext, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Currency } from 'symbol-sdk';
import AlertPopup from './AlertPopup';
import { ConfigurationContext, NFTServiceContext } from './App';
import { LoggerContext } from './FilesContainer';
import Loading from './Loading';

export default function ResellButton({ rootTransactionHash }: { rootTransactionHash: string }) {
    const logger = useContext(LoggerContext);
    const context = useContext(ConfigurationContext);
    const service = useContext(NFTServiceContext);
    const { brokerPrivateKey, feeMultiplier, mosaicDuration, repositoryFactory, buyerPrivateKey, secondBuyerPrivateKey } = context.symbol;
    const [currency, setCurrency] = useState<Currency | undefined>(undefined);

    const [buying, setBuying] = useState<boolean>(false);
    const [buyError, setBuyError] = useState<string | undefined>(undefined);

    const price = 100;
    useEffect(() => {
        repositoryFactory.getCurrencies().subscribe((currencies) => {
            setCurrency(currencies.currency);
        });
    }, [repositoryFactory]);

    if (!currency) {
        return <Loading />;
    }
    const percentage = 5;
    const onBuy = async () => {
        setBuying(true);
        setBuyError(undefined);
        try {
            await service.resellArt({
                rootTransactionHash: rootTransactionHash,
                price: currency.createRelative(price).amount,
                feeMultiplier: feeMultiplier,
                ownerPrivateAccount: buyerPrivateKey,
                brokerPrivateAccount: brokerPrivateKey,
                buyerPrivateAccount: secondBuyerPrivateKey,
                mosaicDuration: mosaicDuration,
                percentage: percentage,
                logger: logger,
            });
            setBuyError(undefined);
        } catch (e) {
            console.error(e);
            setBuyError(`${e}`);
        } finally {
            setBuying(false);
        }
    };
    return (
        <div>
            {buyError ? <AlertPopup message={`Resell Error! ${buyError}`} /> : <span />}
            <Button onClick={onBuy} disabled={buying}>
                {buying && !buyError ? (
                    <Loading label="Reselling..." />
                ) : (
                    <span>
                        Resell for {price} XYM ({percentage}% fee)
                    </span>
                )}
            </Button>
        </div>
    );
}
