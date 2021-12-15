import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { NetworkModule } from '../network/network.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileEntity } from './models/file.entity';

@Module({
    imports: [
        ConfigModule,
        NetworkModule,
        SequelizeModule.forFeature([FileEntity]),
        BullModule.registerQueue({
            name: 'garush',
        }),
    ],
    providers: [FileService],
    controllers: [FileController],
    exports: [FileService],
})
export class FileModule {}
