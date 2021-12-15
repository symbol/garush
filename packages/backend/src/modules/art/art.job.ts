import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { Network } from '../../common/network';
import { ArtService } from './art.service';

@Injectable()
@Processor('garush')
export class ArtJobService {
    constructor(@InjectQueue('garush') private queue: Queue, @Inject(ArtService) private readonly artService: ArtService) {
        queue.add('refresh_art', {}, { repeat: { every: 60000 } });
    }

    @Process('refresh_art')
    async refresh() {
        await this.artService.refreshArtGivenNetwork(Network.SYMBOL);
        await this.artService.refreshArtGivenNetwork(Network.GARUSH);
    }
}
