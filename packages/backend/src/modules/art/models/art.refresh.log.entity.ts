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
    indexes: [
        {
            name: 'unique_network_fromHeight',
            unique: true,
            fields: ['network', 'fromHeight'],
        },
        {
            name: 'unique_network_toHeight',
            unique: true,
            fields: ['network', 'toHeight'],
        },
    ],
})
export class ArtRefreshLogEntity extends Model<ArtRefreshLogEntityAttributes, ArtRefreshLogEntityAttributes> {
    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.BIGINT,
    })
    id?: number;

    @Column({ type: DataType.BIGINT })
    fromHeight: string;

    @Column({ type: DataType.BIGINT })
    toHeight: string;

    @Column({})
    network: Network;

    @Column({})
    total: number;
}
