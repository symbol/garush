import { Fragment } from 'react';
import { NavDropdown } from 'react-bootstrap';
import { LoadingStatus, UserState } from '../../../../../store/user/userSlice';
import LoadingButton from '../../../../basic/LoadingButton';

interface NavUserProfileProps {
    userState?: UserState;
    login: () => void;
    logout: () => void;
}
export default function NavUserProfileLogin(props: NavUserProfileProps) {
    const profileImage = <i className="bi bi-person-circle" style={{ fontSize: '1.3rem' }}></i>;

    return (
        <Fragment>
            {props?.userState?.user?.loggedIn ? (
                <NavDropdown title={profileImage}>
                    <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={props.logout}>Logout</NavDropdown.Item>
                </NavDropdown>
            ) : (
                <LoadingButton  variant="primary" onClick={() => props.login()} text="Login" loading={props.userState?.status === LoadingStatus.loading} /> 
            )}
        </Fragment>
    );
}
