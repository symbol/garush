import { FileMetadataWithTransaction, Logger } from 'garush-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Convert, KeyPair } from 'symbol-sdk';
import { ConfigurationContext, Network } from './App';
import ConfigurationContainer from './ConfigurationContainer';
import FileList from './FileList';

export const LoggerContext = createContext<Logger>({
    log: (message: string) => {
        console.log(message);
    },
});

export default function FilesContainer({ network }: { network: Network }) {
    const { storageService, artistPrivateKey } = useContext(ConfigurationContext)[network];
    const publicAccount = Convert.uint8ToHex(KeyPair.createKeyPairFromPrivateKeyString(artistPrivateKey).publicKey);
    const [files, setFiles] = useState<FileMetadataWithTransaction[] | undefined>(undefined);
    const refresh = () => {
        storageService.loadFilesMetadata(publicAccount).then(setFiles);
    };
    useEffect(() => {
        storageService.loadFilesMetadata(publicAccount).then(setFiles);
    }, [storageService, publicAccount]);

    return (
        <div>
            <h3>{network.toUpperCase()} Network</h3>
            <Button onClick={refresh}>Refresh!</Button>
            <h3>Accounts</h3>
            <ConfigurationContainer network={network} />
            <h3>Files</h3>
            <FileList files={files} network={network} />
        </div>
    );
}
