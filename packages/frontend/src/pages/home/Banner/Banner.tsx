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
import { Button } from 'react-bootstrap';
import styles from './Banner.module.scss';
import Link from 'next/link';
import { Container, Row, Col } from 'react-bootstrap';
export interface BannerProps {}
export default function Banner(props: BannerProps) {
    return (
        <Container className={styles.banner}>
            <Row className={styles.bannerText}>
                <Col sm className="mx-auto" style={{ maxWidth: '50rem' }}>
                    <h1>WELCOME TO THE GARUSH NFT FACTORY AND MARKETPLACE</h1>
                </Col>
            </Row>
            <Row>
                <Col className={styles.bannerButtons}>
                    <Link href="/marketplace" passHref>
                        <Button className={styles.buttonExplore}>EXPLORE</Button>
                    </Link>
                    <Link href="/create" passHref>
                        <Button className={styles.buttonCreate}>CREATE</Button>
                    </Link>
                </Col>
            </Row>
        </Container>
    );
}
