import React from 'react';
import { Button } from 'react-bootstrap';

export default function ConsolePanel({ logs, setLogs }: { logs: string; setLogs: (logs: string) => void }) {
    return (
        <div>
            <Button className="float-end" onClick={() => setLogs('')}>
                Reset Logs
            </Button>{' '}
            <h3>Logs</h3>
            <pre>{logs || 'No Logs'}</pre>
        </div>
    );
}
