import { HeaderType } from 'garush-storage';
import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { Network } from '../../../common/network';

export interface FileEntityAttributes {
    id?: number;
    rootTransactionHash: string;
    network: Network;
    creationHeight: string;
    name: string;
    size: number;
    mime: string;
    version: number;
    parser: string;
    header: Record<string, HeaderType>;
}

@Table({
    tableName: 'file_entity',
    timestamps: true,
})
export class FileEntity extends Model<FileEntityAttributes, FileEntityAttributes> implements FileEntityAttributes {
    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.BIGINT,
    })
    id?: number;

    @Column({ unique: true })
    rootTransactionHash: string;

    @Column({})
    network: Network;

    @Column({ type: DataType.BIGINT })
    creationHeight: string;

    @Column({})
    name: string;

    @Column({})
    size: number;

    @Column({})
    mime: string;

    @Column({})
    version: number;

    @Column({})
    parser: string;

    @Column({ type: DataType.JSONB })
    header: Record<string, HeaderType>;
}
