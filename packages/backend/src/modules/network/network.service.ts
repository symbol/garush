import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RepositoryFactory, RepositoryFactoryHttp } from 'symbol-sdk';
import { Network } from '../../common/network';
import { Configuration, NetworkConfigurations } from '../../config/configuration';

@Injectable({})
export class NetworkService {
    public readonly symbol: RepositoryFactory;
    public readonly garush: RepositoryFactory;
    constructor(private configService: ConfigService<Configuration>) {
        const network = configService.get<NetworkConfigurations>('network');
        this.symbol = new RepositoryFactoryHttp(network.symbol.nodeUrl);
        this.garush = new RepositoryFactoryHttp(network.garush.nodeUrl);
    }

    public getRepositoryFactory(network: Network): RepositoryFactory {
        return network === Network.GARUSH ? this.garush : this.symbol;
    }
}
