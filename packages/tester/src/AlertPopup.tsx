import React, { useState } from 'react';
import { Alert, Button, Modal } from 'react-bootstrap';

export default function AlertPopup({ message, title }: { message: string; title?: string }) {
    const [show, setShow] = useState(true);
    const handleClose = () => setShow(false);
    return (
        <>
            <Modal show={show} size={'lg'} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{title || 'Error'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="danger"> {message}</Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
