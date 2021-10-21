import { Logger } from 'garush-storage';
import React, { useContext, useState } from 'react';
import { StorageServiceContext } from './App';
interface FormFileMetadata {
    size: number;
    mime: string;
    name: string;
    content: Uint8Array;
    contentSize: number;
}

export default function FileUploader({ account, refresh }: { account: string; refresh: () => void }) {
    // On file select (from the pop up)
    const service = useContext(StorageServiceContext);
    const [file, setFile] = useState<FormFileMetadata | undefined>(undefined);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | undefined>(undefined);
    const [logs, setLog] = useState<string>('');

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
        let currentLogs = logs;
        if (!file || uploading) {
            return;
        }
        const feeMultiplier = 100;
        setUploading(true);
        setUploadError(undefined);
        const logger: Logger = {
            log: (message) => {
                currentLogs += message + '\n';
                setLog(currentLogs);
            },
        };
        try {
            await service.storeImage({
                signerPrivateAccount: '0F1F0D1B17E115C507543CEC0D75A2686B81F35756AA729F3B88CFEF595690EC',
                recipientPublicAccount: account,
                content: file.content,
                name: file.name,
                mime: file.mime,
                feeMultiplier: feeMultiplier,
                logger: logger,
            });
            setUploadError(undefined);
            setFile(undefined);
            refresh();
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
        <div>
            <h3>File Upload!</h3>
            <div>
                <input type="file" disabled={uploading} onChange={onFileChange} />
                <button disabled={!file || uploading} onClick={onFileUpload}>
                    Upload!
                </button>
                <button disabled={!file || uploading} onClick={onFileCancel}>
                    Cancel!
                </button>
                <div>
                    {file ? <div>{`File to upload ${file.name} size ${file.contentSize}`}</div> : <span />}
                    {uploading ? <div>{`Uploading....`}</div> : <span />}
                    {uploadError ? <div>{`Upload Error! ${uploadError}`}</div> : <span />}
                    <div>
                        <pre>{logs}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
