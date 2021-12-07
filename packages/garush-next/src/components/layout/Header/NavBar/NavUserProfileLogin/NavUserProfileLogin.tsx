import { Fragment } from 'react';
import { Button, NavDropdown } from 'react-bootstrap';
import { User } from '../../../../../store/UserStore';

interface NavUserProfileProps {
    user?: User;
    login: () => void;
    logout: () => void;
}
export default function NavUserProfileLogin(props: NavUserProfileProps) {
    const profileImage = <i className="bi bi-person-circle" style={{ fontSize: '1.3rem' }}></i>;

    return (
        <Fragment>
            {props?.user?.loggedIn ? (
                <NavDropdown title={profileImage}>
                    <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={props.logout}>Logout</NavDropdown.Item>
                </NavDropdown>
            ) : (
                <Button variant="primary" onClick={() => props.login()}>
                    Login
                </Button>
            )}
        </Fragment>
    );
}
