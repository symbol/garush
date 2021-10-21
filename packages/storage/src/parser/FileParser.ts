export interface SplitResult {
    multiLevelChunks: Uint8Array[][];
    header?: Record<string, unknown>;
}

export interface FileParser {
    name: string;
    supportedMimeTypes: string[];
    split(content: Uint8Array): Promise<SplitResult>;
    join(chunks: Uint8Array[][]): Promise<Uint8Array>;
}
