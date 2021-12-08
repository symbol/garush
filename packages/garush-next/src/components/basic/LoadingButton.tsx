import { Button, ButtonProps, Spinner } from 'react-bootstrap';

interface LoadingButonProps extends ButtonProps {
    loading: boolean;
    text: string;
}

export default function LoadingButton({
    loading,
    text,
    ...props
}: LoadingButonProps): JSX.Element {
    return (
        <Button {...props} disabled={loading}>
            {loading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />}
            { text }
        </Button>
    );
}
