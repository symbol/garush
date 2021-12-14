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
import { Carousel, Col, Container, Row, Tab, Tabs } from 'react-bootstrap';
import Collections from '../Collections/Collections';
import styles from './Middle.module.scss';

export interface MiddleProps {}
export default function Middle(props: MiddleProps): JSX.Element {
    return (
        <Container>
            <Row>
                <Col className={styles.middleHeader} sm>
                    <h3>EXPLORE WHAT&apos;S TRENDING RIGHT NOW</h3>
                </Col>
            </Row>
            <Row>
                <Col sm>
                    <Tabs defaultActiveKey="collections" className="nav-fill">
                        <Tab eventKey="collections" title="COLLECTIONS">
                            <Carousel>
                                <Carousel.Item>
                                    <Collections />
                                </Carousel.Item>
                            </Carousel>
                        </Tab>
                        <Tab eventKey="artists" title="ARTISTS">
                            <div>Artists Content</div>
                        </Tab>
                        <Tab eventKey="allNfts" title="ALL NFTS">
                            <div>All NFTS Content</div>
                        </Tab>
                    </Tabs>
                </Col>
            </Row>
        </Container>
    );
}
