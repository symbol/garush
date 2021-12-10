import React, { useState } from 'react';
import { Network } from './App';
import ConsolePanel from './ConsolePanel';
import FilesContainer, { LoggerContext } from './FilesContainer';
import FileUploader from './FileUploader';
import Site from './Site';

export default function HomePage() {
    const [logs, setLogs] = useState<string>('');

    let currentLogs = logs;
    const logger = {
        log: (message: string) => {
            currentLogs += message + '\n';
            setLogs(currentLogs);
        },
    };
    return (
        <Site>
            <LoggerContext.Provider value={logger}>
                <div className="clearfix">
                    <div className="col-md-6 float-md-end mb-3 ms-md-3 bg-white" style={{ width: '600px', marginBottom: '16px' }}>
                        <div className="border border-dark border-2 border-bottom-0" style={{ padding: '10px' }}>
                            <FileUploader network={Network.garush} />
                        </div>
                        <div className="border border-dark border-2" style={{ padding: '10px' }}>
                            <ConsolePanel logs={logs} setLogs={setLogs} />
                        </div>
                    </div>
                    {Object.values(Network).map((n) => (
                        <div className="border  border-2 border-primary" style={{ padding: '8px', marginBottom: '16px' }} key={n}>
                            <FilesContainer network={n} />
                        </div>
                    ))}
                </div>
            </LoggerContext.Provider>
        </Site>
    );
}
