import { FileMetadata } from 'garush-storage';
import React, { useContext, useEffect, useState } from 'react';
import { ConfigurationContext, StorageServiceContext } from './App';

export default function FilePanel({ metadata, rootHash }: { metadata: FileMetadata; rootHash: string }) {
    const service = useContext(StorageServiceContext);
    const { explorerUrl } = useContext(ConfigurationContext);

    const [content, setContent] = useState<
        | {
              content: Uint8Array;
              dataTransactionsTotalSize: number;
          }
        | undefined
    >(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        service.loadImageFromMetadata(metadata).then(
            (r) => setContent(r),
            (e) => setError(e.message),
        );
    }, [service, metadata]);
    if (error) {
        return <div>Error: {error}</div>;
    }
    if (content) {
        const blob = new Blob([content.content.buffer], { type: metadata.mime });
        if (metadata.mime.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(blob);
            return (
                <a href={`${explorerUrl}/transactions/${rootHash}`}>
                    <img alt={metadata.name} src={objectUrl} /> {content.dataTransactionsTotalSize}
                </a>
            );
        }
        if (metadata.mime.startsWith('audio/')) {
            const objectUrl = URL.createObjectURL(blob);
            return (
                <a href={`${explorerUrl}/transactions/${rootHash}`}>
                    <audio controls={true}>
                        <source src={objectUrl} type={metadata.mime} />
                    </audio>{' '}
                    {content.dataTransactionsTotalSize}
                </a>
            );
        } else {
            const objectUrl = URL.createObjectURL(blob);
            return (
                <a download={metadata.name} href={objectUrl}>
                    Download {metadata.name} {content.dataTransactionsTotalSize}
                </a>
            );
        }
    }
    return <div>Loading</div>;
}
