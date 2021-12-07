import React, { useContext, useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { forkJoin } from 'rxjs';
import { Account, UInt64 } from 'symbol-sdk';
import { ConfigurationContext, Network } from './App';
import Loading from './Loading';

export default function AccountPanel({ accountPrivateKey, network, name }: { accountPrivateKey: string; network: Network; name: string }) {
    const context = useContext(ConfigurationContext)[network];
    const userAccount = Account.createFromPrivateKey(accountPrivateKey, context.networkType);
    const repositoryFactory = context.repositoryFactory;
    const [userBalance, setUserBalance] = useState<number | undefined>(undefined);

    const refresh = () => {
        forkJoin([
            repositoryFactory.getCurrencies(),
            repositoryFactory.createAccountRepository().getAccountInfo(userAccount.address),
        ]).subscribe(
            ([currencies, account]) => {
                const currency = currencies.currency;
                const mosaic = account.mosaics.find((m) => m.id.equals(currency.mosaicId));
                const balance = mosaic?.amount || UInt64.fromUint(0);
                setUserBalance(balance.compact() / Math.pow(10, currency.divisibility));
            },
            () => setUserBalance(0),
        );
    };

    useEffect(refresh, [repositoryFactory, userAccount]);

    return (
        <Card style={{ width: '24rem' }}>
            <Card.Body>
                <Card.Title>{name}</Card.Title>
                <Card.Header>
                    <a target="_blank" href={`${context.explorerUrl}/accounts/${userAccount.address.plain()}`} rel="noreferrer">
                        {userAccount.address.plain()}
                    </a>
                </Card.Header>
                <Card.Body>Private key: {userAccount.privateKey}</Card.Body>
                <Card.Body>Public key: {userAccount.publicKey}</Card.Body>
                <Card.Footer>
                    <a target="_blank" href={`${context.faucetUrl}?recipient=${userAccount.address.plain()}`} rel="noreferrer">
                        Balance: {userBalance?.toString() || <Loading />}
                    </a>
                </Card.Footer>
            </Card.Body>
        </Card>
    );
}
