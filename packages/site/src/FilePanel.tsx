import { FileMetadata, Utils } from 'garush-storage';
import React, { useContext, useEffect, useState } from 'react';
import { Image } from 'react-bootstrap';
import { ConfigurationContext, Network } from './App';
import Loading from './Loading';

type ContentData = {
    content: Uint8Array;
    dataTransactionsTotalSize: number;
};
export default function FilePanel({ metadata, network }: { metadata: FileMetadata; network: Network }) {
    const { storageService } = useContext(ConfigurationContext)[network];

    const [content, setContent] = useState<ContentData | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        storageService.loadImageFromMetadata(metadata).then(
            (r) => setContent(r),
            (e) => setError(Utils.getMessageFromError(e)),
        );
    }, [storageService, metadata]);
    if (error) {
        return <div>Cannot load file: {error}</div>;
    }

    function getFileWidget(content: ContentData) {
        const blob = new Blob([content.content.buffer], { type: metadata.mime });
        if (metadata.mime.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(blob);
            return <Image alt={metadata.name} src={objectUrl} fluid />;
        }
        if (metadata.mime.startsWith('audio/')) {
            const objectUrl = URL.createObjectURL(blob);
            return (
                <audio controls={true}>
                    <source src={objectUrl} type={metadata.mime} />
                </audio>
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

    if (content) {
        return <span title={`${content.dataTransactionsTotalSize} Bytes`}>{getFileWidget(content)}</span>;
    }
    return <Loading />;
}
