import React, { useContext, useState } from 'react';
import { Button, Form, Stack } from 'react-bootstrap';
import AlertPopup from './AlertPopup';
import { ConfigurationContext, Network, NFTServiceContext } from './App';
import { LoggerContext } from './FilesContainer';
import Loading from './Loading';

interface FormFileMetadata {
    size: number;
    mime: string;
    name: string;
    content: Uint8Array;
    contentSize: number;
}

export default function FileUploader({ network }: { network: Network }) {
    // On file select (from the pop up)
    const logger = useContext(LoggerContext);
    const service = useContext(NFTServiceContext);
    const { brokerPrivateKey, artistPrivateKey, mosaicDuration, feeMultiplier } = useContext(ConfigurationContext)[network];
    const [file, setFile] = useState<FormFileMetadata | undefined>(undefined);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | undefined>(undefined);

    const onFileChange = async (event: any) => {
        const uploadedFile = event.target.files[0];

        const getContent = (someFile: any): Promise<Uint8Array> =>
            new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsArrayBuffer(someFile);
                reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
                reader.onerror = (error) => reject(error);
            });
        // Update the state
        const content = await getContent(uploadedFile);
        const metadata: FormFileMetadata = {
            name: uploadedFile.name,
            size: uploadedFile.size,
            mime: uploadedFile.type,
            contentSize: content.byteLength,
            content: content,
        };

        setUploading(false);
        setUploadError(undefined);
        setFile(metadata);
    };

    const onFileUpload = async () => {
        if (!file || uploading) {
            return;
        }
        setUploading(true);
        setUploadError(undefined);
        try {
            await service.createArt({
                garushNetwork: network === Network.garush,
                brokerPrivateAccount: brokerPrivateKey,
                artistPrivateAccount: artistPrivateKey,
                description: `Some NFT description for file ${file.name}`,
                mosaicDuration: mosaicDuration,
                content: file.content,
                name: file.name,
                mime: file.mime,
                feeMultiplier: feeMultiplier,
                logger: logger,
            });
            setUploadError(undefined);
            setFile(undefined);
        } catch (e) {
            console.error(e);
            setUploadError(`${e}`);
        } finally {
            setUploading(false);
        }
    };
    const onFileCancel = () => {
        setFile(undefined);
        setUploading(false);
        setUploadError(undefined);
    };

    return (
        <Stack gap={2}>
            <h4>File Uploader</h4>
            <Form>
                <Form.Group className="mb-3">
                    <Form.Control type="file" disabled={uploading} onChange={onFileChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Button variant="primary" disabled={!file || uploading} onClick={onFileUpload}>
                        {uploading && !uploadError ? <Loading label="Uploading..." /> : 'Upload'}
                    </Button>{' '}
                    <Button variant="secondary" disabled={!file || uploading} onClick={onFileCancel}>
                        Cancel
                    </Button>{' '}
                </Form.Group>
            </Form>
            <div>
                {file ? <div>{`File to upload ${file.name} size ${file.contentSize}`}</div> : <span />}
                {uploadError ? <AlertPopup message={`Upload Error! ${uploadError}`} /> : <span />}
            </div>
        </Stack>
    );
}
