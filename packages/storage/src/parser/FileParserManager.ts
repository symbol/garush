import { FileParser } from './FileParser';
import { GenericFileParser } from './GenericFileParser';
import { PngFileParser } from './PngFileParser';

export class FileParserManager {
    private fileParsers: FileParser[] = [new PngFileParser(), new GenericFileParser()];

    public getFileParser(name: string | undefined): FileParser {
        const expectedName = name || GenericFileParser.NAME;
        const parser = this.fileParsers.find((p) => p.name == expectedName);
        if (!parser) {
            throw new Error(`Cannot find parser with name '${expectedName}'`);
        }
        return parser;
    }

    public getFileParserFromMimeType(mimeType: string | undefined): FileParser {
        if (!mimeType) {
            return this.getFileParser(undefined);
        }
        const expectedMimeType = mimeType.split(';')[0].toLowerCase();
        const parser = this.fileParsers.find((p) => p.supportedMimeTypes.includes(expectedMimeType));
        return parser || this.getFileParser(undefined);
    }
}
