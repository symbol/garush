import { Convert } from 'symbol-sdk';
import { Utils } from '../Utils';
import { FileParser, SplitResult } from './FileParser';
export interface PngChunk {
    data: Buffer;
    type: number;
    name: string;
}

export interface PngMetadata {
    filter: number;
    depth: number;
    color: boolean;
    compr: number;
    alpha: boolean;
    width: number;
    palette: boolean;
    interlace: boolean;
    height: number;
    colorType: number;
}
export class PngFileParser implements FileParser {
    public static readonly NAME = 'png';
    public readonly name = PngFileParser.NAME;
    public readonly supportedMimeTypes = ['image/png'];

    private static COLORTYPE_PALETTE = 1;
    private static COLORTYPE_COLOR = 2;
    private static COLORTYPE_ALPHA = 4;
    private static PNG_SIGNATURE = Convert.hexToUint8('89504e470d0a1a0a');
    private static TYPE_IHDR = 0x49484452;
    private static TYPE_IEND = 0x49454e44;
    private static TYPE_IDAT = 0x49444154;
    private static TYPE_PLTE = 0x504c5445;
    private static TYPE_tRNS = 0x74524e53;
    private static TYPE_gAMA = 0x67414d41;
    private static TYPES = [this.TYPE_IHDR, this.TYPE_IDAT, this.TYPE_IEND, this.TYPE_PLTE, this.TYPE_tRNS, this.TYPE_gAMA];

    public getMetadata(content: Buffer): PngMetadata {
        // NOT USED YET, but could be useful to show user friendly metadata to the user.
        const signature = this.getSignatureChunk(content);
        const header = this.getChunk(content, signature.data.length, PngFileParser.TYPE_IHDR);
        const data = header.data.slice(8);
        const width = data.readUInt32BE(0);
        const height = data.readUInt32BE(4);
        const depth = data[8];
        const colorType = data[9]; // bits: 1 palette, 2 color, 4 alpha
        const compr = data[10];
        const filter = data[11];
        const interlace = data[12];
        return {
            width: width,
            height: height,
            depth: depth,
            interlace: Boolean(interlace),
            palette: Boolean(colorType & PngFileParser.COLORTYPE_PALETTE),
            color: Boolean(colorType & PngFileParser.COLORTYPE_COLOR),
            alpha: Boolean(colorType & PngFileParser.COLORTYPE_ALPHA),
            compr: compr,
            filter: filter,
            colorType: colorType,
        };
    }

    public getChunk(data: Buffer, start: number, expectedType?: number): PngChunk {
        const chunkSize = data.readUInt32BE(start);
        const type = data.readUInt32BE(start + 4);
        const chunkType = data.slice(start + 4, start + 8);
        let name = '';
        for (let i = 4; i < 8; i++) {
            name += String.fromCharCode(data[start + i]);
        }
        const isValid = PngFileParser.TYPES.find((t) => t == type);
        if (!isValid) {
            throw new Error(`Invalid png type ${Convert.uint8ToHex(chunkType)}`);
        }
        if (expectedType && expectedType != type) {
            throw new Error(`Invalid expected type ${Convert.uint8ToHex(chunkType)}. Expected DECIMAL ${expectedType} but got ${type}`);
        }
        const end = start + chunkSize + 4 + 4 + 4;
        const chunk = data.slice(start, end);
        return { data: chunk, type, name };
    }

    private getSignatureChunk(data: Buffer): PngChunk {
        const signature = data.slice(0, 8);
        if (!Utils.arraysEqual(signature, PngFileParser.PNG_SIGNATURE)) {
            throw new Error(`Invalid PNG signature ${Convert.uint8ToHex(signature)}`);
        }
        return {
            data: signature,
            name: 'signature',
            type: 0,
        };
    }

    public getChunks(data: Buffer): PngChunk[] {
        const chunks: PngChunk[] = [];
        chunks.push(this.getSignatureChunk(data));
        let start = 8;
        while (start < data.length) {
            const chunk = this.getChunk(data, start);
            chunks.push(chunk);
            start += chunk.data.length;
        }
        return chunks;
    }

    split(content: Uint8Array): Promise<SplitResult> {
        const data = Buffer.from(content);
        const chunks = this.getChunks(data);
        const ihdrChunk = chunks[1];
        const multiLevelChunks = chunks.map((c) => Utils.split(c.data));
        const ihdr = Convert.uint8ToHex(ihdrChunk.data);
        const header = {
            [ihdrChunk.name]: ihdr,
            ...this.getMetadata(data),
        };
        return Promise.resolve({
            multiLevelChunks: multiLevelChunks,
            header: header,
        });
    }

    join = Utils.join;
}
