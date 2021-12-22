import { FileMetadata, Utils, YamlUtils } from 'garush-storage';
import _ from 'lodash';
import React, { useContext, useState } from 'react';
import { Stack } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useAsyncEffect } from 'use-async-effect';
import { ConfigurationContext, Network } from './App';
import FilePanel from './FilePanel';
import Loading from './Loading';
import Site from './Site';

export default function FileExplorer() {
    const { transactionRootHash, network } = useParams<{ transactionRootHash: string; network: Network }>();
    const { storageService } = useContext(ConfigurationContext)[network];
    const [file, setFile] = useState<FileMetadata | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);
    const { explorerUrl } = useContext(ConfigurationContext)[network];
    useAsyncEffect(async () => {
        try {
            const metadata = await storageService.loadMetadataFromHash(transactionRootHash);
            setFile(metadata);
        } catch (e) {
            const message = Utils.getMessageFromError(e);
            setError(`Cannot load file ${transactionRootHash}. Error: ${message}`);
        }
    }, [storageService, transactionRootHash]);
    if (error) {
        return <div>Cannot load file: {error}</div>;
    }
    if (!file) {
        return <Loading />;
    }
    const { hashes, ...metadata } = file;
    return (
        <Site>
            <Stack gap={3} direction="vertical">
                <FilePanel metadata={file} network={network} />
                <pre>{YamlUtils.toYaml(_.omit(metadata, 'rootTransaction'))}</pre>
                <div>
                    Root Transaction:{' '}
                    <a
                        target="_blank"
                        title={`Transaction Hash ${transactionRootHash}`}
                        href={`${explorerUrl}/transactions/${transactionRootHash}`}
                        rel="noreferrer"
                    >
                        {transactionRootHash}
                    </a>
                    {hashes.map((dataHash, dataIndex) => {
                        return (
                            <div key={dataHash}>
                                Data Transaction {dataIndex + 1}: <a href={`${explorerUrl}/transactions/${dataHash}`}>{dataHash}</a>
                            </div>
                        );
                    })}{' '}
                </div>
            </Stack>
        </Site>
    );
}
