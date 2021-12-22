import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { Network } from '../../common/network';
import { BullMQConfiguration, Configuration } from '../../config/configuration';
import { ArtService } from './art.service';

@Injectable()
@Processor('garush')
export class ArtJobService {
    private readonly logger = new Logger(ArtJobService.name);

    constructor(
        @InjectQueue('garush') private queue: Queue,
        @Inject(ArtService) private readonly artService: ArtService,
        private configService: ConfigService<Configuration>,
    ) {
        const bullMQConfiguration = configService.get<BullMQConfiguration>('bullmq');
        const every = bullMQConfiguration.refreshArtJobSchedulerEvery;
        queue.add('refresh_art', {}, { repeat: { every: every } }).then(
            () => {
                this.logger.log(`refresh_art job running every ${every / 1000} seconds`);
            },
            (e) => {
                this.logger.error(`refresh_art job didn't start. Error: ${e.message || e}`, e);
            },
        );
    }

    @Process('refresh_art')
    async refresh() {
        await this.artService.refreshArtGivenNetwork(Network.SYMBOL);
        await this.artService.refreshArtGivenNetwork(Network.GARUSH);
    }
}
