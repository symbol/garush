import { NFTService, SearchService, StorageService } from 'garush-storage';
import React, { createContext } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Convert, Crypto, NetworkType, RepositoryFactory, RepositoryFactoryHttp } from 'symbol-sdk';
import './App.css';
import Dashboard from './Dashboard';
import FileExplorer from './FileExplorer';
import HomePage from './HomePage';
import { URLHelpers } from './URLHelpers';
export enum Network {
    'garush' = 'garush',
    'symbol' = 'symbol',
}

export interface Accounts {
    brokerPrivateKey: string;
    buyerPrivateKey: string;
    secondBuyerPrivateKey: string;
    artistPrivateKey: string;
}
const localStorage = window.localStorage;
let storageKey = 'networkAccounts';
let networkAccountsJson = localStorage.getItem(storageKey);

const randomAccounts = (): Accounts => ({
    brokerPrivateKey: Convert.uint8ToHex(Crypto.randomBytes(32)),
    buyerPrivateKey: Convert.uint8ToHex(Crypto.randomBytes(32)),
    secondBuyerPrivateKey: Convert.uint8ToHex(Crypto.randomBytes(32)),
    artistPrivateKey: Convert.uint8ToHex(Crypto.randomBytes(32)),
});

if (!networkAccountsJson) {
    networkAccountsJson = JSON.stringify({
        [Network.symbol]: randomAccounts(),
        [Network.garush]: randomAccounts(),
    });
    localStorage.setItem(storageKey, networkAccountsJson);
}
const networksAccounts: Record<Network, Accounts> = JSON.parse(networkAccountsJson);

const symbolNetworkType = NetworkType.TEST_NET;
const garushNetworkType = NetworkType.TEST_NET;
const garushNetUrl = 'https://demo-001.garush.dev:3001';
const garushFaucetUrl = 'https://faucet.garush.dev';
const symbolFaucetUrl = 'https://testnet.symbol.tools';
const symbolNetUrl = 'https://001-joey-dual.symboltest.net:3001';
const garushExplorerUrl = 'https://explorer.garush.dev';
const symbolExplorerUrl = 'https://testnet.symbol.fyi';

const garushRepositoryFactory = new RepositoryFactoryHttp(garushNetUrl, {
    websocketUrl: `${URLHelpers.httpToWsUrl(garushNetUrl)}/ws`,
    websocketInjected: WebSocket,
    networkType: garushNetworkType,
});

const symbolRepositoryFactory = new RepositoryFactoryHttp(symbolNetUrl, {
    websocketUrl: `${URLHelpers.httpToWsUrl(symbolNetUrl)}/ws`,
    websocketInjected: WebSocket,
    networkType: symbolNetworkType,
});

const configuration: Record<
    Network,
    Accounts & {
        explorerUrl: string;
        faucetUrl: string;
        mosaicDuration: number;
        feeMultiplier: number;
        repositoryFactory: RepositoryFactory;
        networkType: NetworkType;
        storageService: StorageService;
        searchService: SearchService;
    }
> = {
    [Network.garush]: {
        ...networksAccounts[Network.garush],
        explorerUrl: garushExplorerUrl,
        faucetUrl: garushFaucetUrl,
        feeMultiplier: 100,
        mosaicDuration: 0,
        repositoryFactory: garushRepositoryFactory,
        networkType: garushNetworkType,
        storageService: new StorageService(garushRepositoryFactory),
        searchService: new SearchService(garushRepositoryFactory),
    },
    [Network.symbol]: {
        ...networksAccounts[Network.symbol],
        explorerUrl: symbolExplorerUrl,
        faucetUrl: symbolFaucetUrl,
        feeMultiplier: 100,
        mosaicDuration: 0,
        repositoryFactory: symbolRepositoryFactory,
        networkType: symbolNetworkType,
        storageService: new StorageService(symbolRepositoryFactory),
        searchService: new SearchService(symbolRepositoryFactory),
    },
};
export const ConfigurationContext = createContext(configuration);

const nftService = new NFTService(symbolRepositoryFactory, garushRepositoryFactory);
export const NFTServiceContext = createContext(nftService);

//http://localhost:3000/TBNBG3MERSXD5U3CSQEVTCMEUAFBSOVHVGIIDEQ

export default function App() {
    return (
        <NFTServiceContext.Provider value={nftService}>
            <ConfigurationContext.Provider value={configuration}>
                <Router>
                    <Switch>
                        <Route exact path="/" component={HomePage} />
                        <Route exact path="/explorer/:network/:transactionRootHash" component={FileExplorer} />
                        <Route exact path="/dashboard/:network" component={Dashboard} />
                    </Switch>
                </Router>
            </ConfigurationContext.Provider>
        </NFTServiceContext.Provider>
    );
}
