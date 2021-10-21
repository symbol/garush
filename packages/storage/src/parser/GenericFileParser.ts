import * as _ from 'lodash';
import { Utils } from '../Utils';
import { FileParser, SplitResult } from './FileParser';

export class GenericFileParser implements FileParser {
    public static readonly NAME = 'generic';
    public readonly name = GenericFileParser.NAME;
    public readonly supportedMimeTypes = []; //All

    split(content: Uint8Array): Promise<SplitResult> {
        const multiLevelChunks = _.chunk(Utils.split(content), 100);
        return Promise.resolve({ multiLevelChunks: multiLevelChunks });
    }
    join = Utils.join;
}
