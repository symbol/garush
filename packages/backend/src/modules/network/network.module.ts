import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NetworkService } from './network.service';

@Module({
    imports: [ConfigModule],
    providers: [NetworkService],
    exports: [NetworkService],
})
export class NetworkModule {}
