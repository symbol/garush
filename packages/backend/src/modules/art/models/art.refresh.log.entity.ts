import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { Network } from '../../../common/network';

export interface ArtRefreshLogEntityAttributes {
    id?: number;
    fromHeight: bigint;
    toHeight: bigint;
    network: Network;
    total: number;
}

@Table({
    tableName: 'art_refresh_log_entity',
    timestamps: true,
})
export class ArtRefreshLogEntity extends Model<ArtRefreshLogEntityAttributes, ArtRefreshLogEntityAttributes> {
    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.BIGINT,
    })
    id?: number;

    @Column({ type: DataType.BIGINT, unique: 'fromHeight_network_unique' })
    fromHeight: string;

    @Column({ type: DataType.BIGINT, unique: 'toHeight_network_unique' })
    toHeight: string;

    @Column({})
    network: Network;

    @Column({})
    total: number;
}
