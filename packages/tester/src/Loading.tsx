import React from 'react';
import { Spinner } from 'react-bootstrap';

export default function Loading({ label = 'Loading...' }) {
    return (
        <Spinner size="sm" animation="border" role="status" title={label}>
            <span className="visually-hidden">{label}</span>
        </Spinner>
    );
}
