import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { FileModule } from '../file/file.module';
import { NetworkModule } from '../network/network.module';
import { ArtController } from './art.controller';
import { ArtJobService } from './art.job';
import { ArtService } from './art.service';
import { ArtEntity } from './models/art.entity';
import { ArtRefreshLogEntity } from './models/art.refresh.log.entity';

@Module({
    imports: [
        ConfigModule,
        NetworkModule,
        FileModule,
        SequelizeModule.forFeature([ArtEntity, ArtRefreshLogEntity]),
        BullModule.registerQueue({
            name: 'garush',
        }),
    ],
    providers: [ArtService, ArtJobService, ArtController],
    controllers: [ArtController],
})
export class ArtModule {}
