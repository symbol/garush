import * as http from 'http';
import * as https from 'https';
import { toArray } from 'rxjs/operators';
import { Convert, MetadataType, MosaicId, MosaicInfo, RepositoryFactory } from 'symbol-sdk';

export interface NemberArtMosaicData {
    v: number;
    artistName: string;
    medium: string;
    dimensions: string;
    creationDate: string;
    rarity: string;
    uid: string;
    edition: number;
    totalEditions: number;
}

export interface NemberArtMosaicMetadata {
    data: { meta: { name: string; description: string }; media: { ipfs: string } };
    v: number;
}

export class NFTService {
    constructor(private readonly repositoryFactory: RepositoryFactory) {}

    //http://ngl-dual-601.symbolblockchain.io:3000/transactions/confirmed?type=16724&transferMosaicId=1D6E695EA6C6EA31&embedded=true

    //http://ngl-dual-601.symbolblockchain.io:3000/transactions/confirmed/4EB724BC80F9368F62BA69E0B48F0A80CAB1069B58DE9E56AA8D6D865BD4BDCA

    //500.000000
    //9500.000000
    //https://nember.art/art?id=1D6E695EA6C6EA31

    //1D6E695EA6C6EA31
    //4EF18BE1687BB030
    public async takeNemberArt(mosaicId: MosaicId): Promise<{ matadata: NemberArtMosaicMetadata; mosaic: MosaicInfo }> {
        const mosaicRepository = this.repositoryFactory.createMosaicRepository();
        const mosaic = await mosaicRepository.getMosaic(mosaicId).toPromise();
        return { mosaic: mosaic, matadata: await this.getMetadata(mosaic) };
    }

    public async getMetadata(mosaic: MosaicInfo): Promise<NemberArtMosaicMetadata> {
        //TODO create composite id if the metadata if possible.
        const metadataRepository = this.repositoryFactory.createMetadataRepository();
        const searchedMetadata = await metadataRepository
            .streamer()
            .search({
                metadataType: MetadataType.Mosaic,
                targetId: mosaic.id,
                targetAddress: mosaic.ownerAddress,
            })
            .pipe(toArray())
            .toPromise();

        const finalMetadata = searchedMetadata
            .map((m) => {
                try {
                    return JSON.parse(m.metadataEntry.value) as NemberArtMosaicMetadata;
                } catch (e) {
                    try {
                        return JSON.parse(Convert.hexToUtf8(m.metadataEntry.value)) as NemberArtMosaicMetadata;
                    } catch (e) {
                        console.error(e);
                        return undefined;
                    }
                }
            })
            .find((m) => m !== undefined && m.v === 1);
        if (!finalMetadata) {
            throw new Error(`Cannot find metadata for mosaic ${mosaic.id.toHex()}`);
        }
        return finalMetadata;
    }

    public downloadFile(url: string): Promise<{ mime: string; content: Buffer }> {
        return new Promise<{ mime: string; content: Buffer }>((resolve, reject) => {
            (url.toLowerCase().startsWith('https:') ? https : http)
                .get(url, (res) => {
                    const mime = res.headers['content-type'];
                    if (!mime) {
                        return reject(new Error('Mime type cannot be resolved!'));
                    } else {
                        const buffers: Uint8Array[] = [];
                        res.on('error', (err) => reject(err));
                        res.on('data', (chunk) => {
                            buffers.push(chunk);
                        }).on('end', () => {
                            const buffer = Buffer.concat(buffers);
                            return resolve({ mime, content: buffer });
                        });
                    }
                })
                .on('error', (err) => reject(err));
        });
    }
}
