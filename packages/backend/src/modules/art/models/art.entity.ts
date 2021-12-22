import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Network } from '../../../common/network';
import { FileEntity } from '../../file/models/file.entity';

export interface ArtEntityAttributes {
    id?: number;
    mosaicId: string;
    artistAddress: string;
    ownerAddress: string;
    network: Network;
    creationHeight: string;
    description: string;
    royalty: number;
    fileId: number;
    file: FileEntity;
}

@Table({
    tableName: 'art_entity',
    timestamps: true,
})
export class ArtEntity extends Model<ArtEntityAttributes, ArtEntityAttributes> implements ArtEntityAttributes {
    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.BIGINT,
    })
    id?: number;

    @Column({
        unique: true,
    })
    mosaicId: string;

    @BelongsTo(() => FileEntity)
    file: FileEntity;

    @ForeignKey(() => FileEntity)
    @Column({ unique: true })
    fileId: number;

    @Column({})
    artistAddress: string;

    @Column({})
    ownerAddress: string;

    @Column({})
    description: string;

    @Column({})
    royalty: number;

    @Column({})
    network: Network;

    @Column({ type: DataType.BIGINT })
    creationHeight: string;
}
