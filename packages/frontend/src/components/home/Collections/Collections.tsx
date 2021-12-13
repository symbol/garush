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
import { Col, Container, Row } from 'react-bootstrap';
import styles from './Collections.module.scss';
import Image from 'next/image';

export interface CollectionsProps {}
export default function Collections(props: CollectionsProps) {
    const collection = {
        title: 'Coll ',
        floorPrice: '$100',
        listingPrice: '$200',
        likes: '100',
        image: 'https://picsum.photos/180',
    };
    const collections = Array(6)
        .fill(collection)
        .map((c, inx) => ({ ...c, title: c.title + (inx + 1) }));
    return (
        <Container>
            <Row xs={1} md={2} className={'g-4 ' + styles.row}>
                {collections.map((c, inx) => (
                    <Col id={'col_' + inx} key={'col_' + inx}>
                        {
                            <div className="card flex-row flex-wrap">
                                <div className="card-header border-0">
                                    <Image src={c.image + `?order=${inx}`} alt="" width="180" height="180" />
                                </div>
                                <div className={styles.cardBlock + ' card-block px-2'}>
                                    <h4 className="card-title">{c.title}</h4>
                                    <p className="card-text">Floor price: {c.floorPrice}</p>
                                    <a href="#" className="btn btn-secondary">
                                        Details
                                    </a>
                                </div>
                            </div>
                        }
                    </Col>
                ))}
            </Row>
        </Container>
    );
}
