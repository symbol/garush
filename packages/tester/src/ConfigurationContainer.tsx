import React, { useContext } from 'react';
import { Stack } from 'react-bootstrap';
import AccountPanel from './AccountPanel';
import { ConfigurationContext, Network } from './App';

export default function ConfigurationContainer({ network }: { network: Network }) {
    const context = useContext(ConfigurationContext)[network];
    const artistPrivateKey = context.artistPrivateKey;
    const brokerPrivateKey = context.brokerPrivateKey;
    const buyerPrivateKey = context.buyerPrivateKey;
    const secondBuyerPrivateKey = context.secondBuyerPrivateKey;

    return (
        <Stack direction="horizontal" gap={3}>
            <AccountPanel accountPrivateKey={artistPrivateKey} network={network} name="Artist" />
            <AccountPanel accountPrivateKey={brokerPrivateKey} network={network} name="Broker" />
            {network === Network.symbol ? <AccountPanel accountPrivateKey={buyerPrivateKey} network={network} name="Buyer" /> : <span />}
            {network === Network.symbol ? (
                <AccountPanel accountPrivateKey={secondBuyerPrivateKey} network={network} name="Second Buyer" />
            ) : (
                <span />
            )}
        </Stack>
    );
}
