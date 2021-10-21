import { FileMetadata } from 'garush-storage';
import React, { useContext, useEffect, useState } from 'react';
import { Transaction } from 'symbol-sdk';
import { StorageServiceContext } from './App';
import FileList from './FileList';
import FileUploader from './FileUploader';

export default function FilesContainer({ account }: { account: string }) {
    const service = useContext(StorageServiceContext);
    const [files, setFiles] = useState<{ metadata: FileMetadata; rootTransaction: Transaction }[] | undefined>(undefined);
    const refresh = () => {
        service.loadImagesMetadata(account).then(setFiles);
    };
    useEffect(() => {
        service.loadImagesMetadata(account).then(setFiles);
    }, [service, account]);
    return (
        <div>
            <FileUploader account={account} refresh={refresh} />
            <br />
            <button onClick={refresh}>refresh!</button>
            <br />
            <FileList files={files} />
        </div>
    );
}
