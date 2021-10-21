import { FileMetadata, StorageService, Utils } from 'garush-storage';
import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch, useParams } from 'react-router-dom';
import { Convert, Crypto, NetworkType, RepositoryFactoryHttp } from 'symbol-sdk';
import { useAsyncEffect } from 'use-async-effect';
import './App.css';
import FilePanel from './FilePanel';
import FilesContainer from './FilesContainer';
import Site from './Site';
import { URLHelpers } from './URLHelpers';

const networkType = NetworkType.TEST_NET;
const epochAdjustment = 1634235224;
const generationHash = '8E994B5DD6798CD34FEABE4B293DF355011E94CE8AADE8985FD6E736ACD94DC4';
const url = 'https://demo-001.garush.dev:3001';
const repositoryFactory = new RepositoryFactoryHttp(url, {
    epochAdjustment: epochAdjustment,
    generationHash: generationHash,
    networkType: networkType,
    websocketUrl: URLHelpers.httpToWsUrl(url) + '/ws',
    websocketInjected: WebSocket,
});
const service = new StorageService(repositoryFactory);
export const StorageServiceContext = createContext(service);

const explorerUrl = 'https://explorer.garush.dev';
const configuration = { explorerUrl: explorerUrl };
export const ConfigurationContext = createContext(configuration);

//http://localhost:3000/TBNBG3MERSXD5U3CSQEVTCMEUAFBSOVHVGIIDEQ

const HomePage = () => {
    const { account } = useParams<{ account: string }>();
    return (
        <Site>
            <FilesContainer account={account} />
        </Site>
    );
};

const FileExplorer = () => {
    const { transactionRootHash } = useParams<{ transactionRootHash: string }>();
    const service = useContext(StorageServiceContext);
    const [file, setFile] = useState<FileMetadata | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    useAsyncEffect(async () => {
        try {
            const metadata = await service.loadMetadataFromHash(transactionRootHash);
            setFile(metadata);
        } catch (e) {
            const message = Utils.getMessageFromError(e);
            setError(`Cannot load file ${transactionRootHash}. Error: ${message}`);
        }
    }, [service, transactionRootHash]);
    return (
        <Site>
            {error && <div>{error}</div>}
            {file && <FilePanel metadata={file} rootHash={transactionRootHash} />}
        </Site>
    );
};

export default function App() {
    return (
        <StorageServiceContext.Provider value={service}>
            {' '}
            <ConfigurationContext.Provider value={configuration}>
                <Router>
                    <Switch>
                        <Route exact path="/">
                            <Redirect to={'/' + Convert.uint8ToHex(Crypto.randomBytes(32))} />
                        </Route>
                        <Route exact path="/:account" component={HomePage} />
                        <Route exact path="/explorer/:transactionRootHash" component={FileExplorer} />
                    </Switch>
                </Router>
            </ConfigurationContext.Provider>
        </StorageServiceContext.Provider>
    );
}
