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

import Link from 'next/link';
import { Container, Form, FormControl, InputGroup, Nav, Navbar } from 'react-bootstrap';
import { useAppDispatch } from '../../../../store/hooks';
import { fetchUserAsync, logout, useGetterUser } from '../../../../store/user/userSlice';
import Logo from './Logo/Logo';
import styles from './NavBar.module.scss';
import NavUserProfileLogin from './NavUserProfileLogin/NavUserProfileLogin';

export interface NavBarProps {}

export default function NavBar(props: NavBarProps): JSX.Element {
    const dispatch = useAppDispatch();
    const userState = useGetterUser();
    const userLogin = () => dispatch(fetchUserAsync('user@example.com'));
    const userLogout = () => dispatch(logout());
    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container fluid>
                <Link href="/" passHref>
                    <Navbar.Brand>
                        <Logo />
                    </Navbar.Brand>
                </Link>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mx-auto my-2 my-lg-0" navbarScroll>
                        <Link href="/marketplace" passHref>
                            <Nav.Link className={styles.navLink}>MARKETPLACE</Nav.Link>
                        </Link>
                        <Link href="/create" passHref>
                            <Nav.Link className={styles.navLink}>CREATE</Nav.Link>
                        </Link>
                        <Link href="/dashboard" passHref>
                            <Nav.Link className={styles.navLink}>DASHBOARD</Nav.Link>
                        </Link>
                    </Nav>
                    <Form className="d-flex">
                        <InputGroup>
                            <InputGroup.Text>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <FormControl type="search" placeholder="Search" className="me-2" aria-label="Search" />
                        </InputGroup>
                    </Form>
                    <NavUserProfileLogin login={userLogin} logout={userLogout} userState={userState} />
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
