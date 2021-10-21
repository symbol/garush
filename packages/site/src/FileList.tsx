import { FileMetadata, YamlUtils } from 'garush-storage';
import React, { useContext } from 'react';
import { Transaction } from 'symbol-sdk';
import { ConfigurationContext } from './App';
import FilePanel from './FilePanel';

export default function FileList({ files }: { files?: { metadata: FileMetadata; rootTransaction: Transaction }[] }) {
    const { explorerUrl } = useContext(ConfigurationContext);
    if (files === undefined) {
        return <div>Loading files</div>;
    }
    if (!files.length) {
        return <div>No files! You can upload some!</div>;
    }
    return (
        <ul>
            {files.map((file, fileIndex) => {
                const hash = file.rootTransaction.transactionInfo?.hash;
                if (!hash) {
                    throw new Error('Root hash must exist!');
                }
                return (
                    <li key={fileIndex}>
                        <FilePanel metadata={file.metadata} rootHash={hash} />
                        <br />
                        <pre>{YamlUtils.toYaml(file.metadata)}</pre>
                        <br />
                        Root Transaction: <a href={`${explorerUrl}/transactions/${hash}`}>{hash}</a> <br />
                        <a href={`explorer/${hash}`}>Image Link</a>
                        {file.metadata.hashes.map((dataHash, dataIndex) => {
                            return (
                                <div key={dataIndex}>
                                    Data Transaction {dataIndex + 1}: <a href={`${explorerUrl}/transactions/${dataHash}`}>{dataHash}</a>
                                </div>
                            );
                        })}
                        <br />
                    </li>
                );
            })}
        </ul>
    );
}
