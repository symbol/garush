/*
 * (C) Symbol Contributors 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */

import { Fragment } from 'react';
import { NavDropdown } from 'react-bootstrap';
import { UserState } from '@store/user/userSlice';
import LoadingButton from '@components/basic/LoadingButton';
import { LoadingStatus } from '@store/baseSlice';

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
                <LoadingButton
                    variant="primary"
                    onClick={() => props.login()}
                    text="Login"
                    loading={props.userState?.loadingStatus === LoadingStatus.loading}
                />
            )}
        </Fragment>
    );
}
