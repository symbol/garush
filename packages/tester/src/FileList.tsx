import { FileMetadata } from 'garush-storage';
import { Stack } from 'react-bootstrap';
import { Transaction } from 'symbol-sdk';
import { Network } from './App';
import FileCard from './FileCard';
import Loading from './Loading';

export default function FileList({
    files,
    network,
}: {
    files?: { metadata: FileMetadata; rootTransaction: Transaction }[];
    network: Network;
}) {
    if (files === undefined) {
        return <Loading />;
    }
    if (!files.length) {
        return <div>No files! You can upload some!</div>;
    }
    return (
        <Stack gap={3} direction="horizontal">
            {files.map((file, fileIndex) => {
                const hash = file.rootTransaction.transactionInfo?.hash;
                if (!hash) {
                    throw new Error('Root hash must exist!');
                }
                return <FileCard key={fileIndex} file={file} network={network} />;
            })}
        </Stack>
    );
}
