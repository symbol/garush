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
import React, { useEffect } from 'react';
import { Container, Button, Modal, Row, Col, Form, InputGroup } from 'react-bootstrap';
import styles from './Traits.module.scss';

export enum TraitType {
    text = 'text',
    numeric = 'numeric',
    stats = 'stats',
}

export interface TraitsProps {
    type: TraitType;
}
export default function Traits(props: TraitsProps) {
    const [modalPropertiesShow, setModalPropertiesShow] = React.useState(false);
    const [properties, setProperties] = React.useState<TraitsProperty[]>([]);
    const onSave = (prps: TraitsProperty[]) => {
        setProperties(prps);
    };
    let listingIconCls, title, desc;
    switch (props.type) {
        case TraitType.text:
            listingIconCls = 'bi bi-list-ul';
            title = 'Property';
            desc = 'Textual traits that show up as rectangles';
            break;
        case TraitType.numeric:
            listingIconCls = 'bi bi-star-fill';
            title = 'Levels';
            desc = 'Numerical traits that show as a progress bar';
            break;
        case TraitType.stats:
            listingIconCls = 'bi bi-bar-chart-fill';
            title = 'Stats';
            desc = 'Numerical traits that just show as numbers';
            break;
    }

    const modalTitle = `Add ${title}`;
    return (
        <Container fluid className={'m-0 p-0 ' + styles.traitsContainer}>
            <div className={styles.traitsItem}>
                <div className={styles.traitsItemContent}>
                    <i className={listingIconCls} />
                    <div>
                        <span>{title}</span>
                        <p className="form-text text-muted">{desc}</p>
                    </div>
                </div>
                <div className={styles.traitsItemSide}>
                    <Button variant="primary" size="sm" onClick={() => setModalPropertiesShow(true)}>
                        <i className="bi bi-plus-circle" />
                    </Button>
                </div>
            </div>
            {props.type === TraitType.text && (
                <div className={styles.textualTraitsItemList}>
                    {properties.map((p, index) => (
                        <a target="_blank" href="/assets?filteredBy=properties" key={p.key + '_' + index}>
                            <div>
                                <div>{p.key}</div>
                                <div>{p.value}</div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
            {props.type !== TraitType.text && (
                <div className={styles.numericTraitsItemList}>
                    {properties.map((p, index) => (
                        <a target="_blank" href="/assets?filteredBy=levels" key={index}>
                            <div className={styles.numericTraitsItemList_item} key={index}>
                                <div className={styles.numericTraitsItemList_item_label}>
                                    <div className={styles.numericTraitsItemList_item_label_type}>{p.key}</div>
                                    <div className={styles.numericTraitsItemList_item_label_value}>
                                        {(p.value as NumericVal).xOf} of {(p.value as NumericVal).y}
                                    </div>
                                </div>
                                {props.type !== TraitType.stats && (
                                    <div className={styles.numericTraitsItemList_item_bar} key={index}>
                                        <div
                                            className={styles.numericTraitsItemList_item_barFill}
                                            style={{ width: ((p.value as NumericVal).xOf / (p.value as NumericVal).y) * 100 + '%' }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        </a>
                    ))}
                </div>
            )}

            {modalPropertiesShow && (
                <TraitsModal
                    show={modalPropertiesShow}
                    onHide={() => setModalPropertiesShow(false)}
                    title={modalTitle}
                    onSave={onSave}
                    properties={properties}
                    type={props.type}
                />
            )}
        </Container>
    );
}

interface TraitsModalProps {
    type: TraitType;
    onHide: () => void;
    onSave: (traits: TraitsProperty[]) => void;
    show?: boolean;
    title: string;
    description?: string;
    properties?: TraitsProperty[];
}
export function TraitsModal(props: TraitsModalProps) {
    const [properties, setProperties] = React.useState<TraitsProperty[]>([]);
    return (
        <Modal {...props} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">{props.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TraitsInsertUpdateForm onChange={setProperties} properties={props.properties} type={props.type} />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={props.onHide}>
                    Close
                </Button>
                <Button
                    variant="primary"
                    onClick={() => {
                        props.onSave(properties);
                        props.onHide();
                    }}
                >
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
interface NumericVal {
    xOf: number;
    y: number;
}
interface TraitsProperty {
    key: string;
    value: string | NumericVal;
}
interface TraitsInsertUpdateFormProps {
    type: TraitType;
    onChange?: (traits: TraitsProperty[]) => void;
    properties?: TraitsProperty[];
}
function TraitsInsertUpdateForm(props: TraitsInsertUpdateFormProps) {
    const initialProperties = props.properties?.length
        ? props.properties
        : props.type === TraitType.text
        ? [{ key: '', value: '' }]
        : [{ key: '', value: { xOf: 3, y: 5 } }];
    const [properties, setProperties] = React.useState<TraitsProperty[]>([...initialProperties]);
    useEffect(() => {
        const validRows = [
            ...properties.filter(
                (p) =>
                    p.key.length > 0 &&
                    ((typeof p.value === 'string' && p.value.length > 0) || (typeof p.value !== 'string' && p.value.xOf > 0))
            ),
        ];
        props.onChange && props.onChange(validRows);
    }, [props, properties]);
    const addMore = () => {
        setProperties([...properties, props.type === TraitType.text ? { key: '', value: '' } : { key: '', value: { xOf: 3, y: 5 } }]);
    };
    const removeProperty = (index: number) => {
        setProperties(properties.filter((_, i) => i !== index));
    };
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const targetName = e.target.name;
        if (targetName === 'key' || targetName === 'value') {
            properties[index][targetName] = e.target.value;
            setProperties([...properties]);
        }
    };
    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const targetName = e.target.name;
        if (targetName === 'xOf') {
            (properties[index].value as NumericVal).xOf = parseInt(e.target.value);
            setProperties([...properties]);
        } else if (targetName === 'y') {
            (properties[index].value as NumericVal).y = parseInt(e.target.value);
            setProperties([...properties]);
        }
    };

    return (
        <Container>
            {properties.map((property, index) => (
                <Row key={'row_' + index}>
                    <Col xs="1">
                        <i className="bi bi-x-circle" onClick={() => removeProperty(index)} />
                    </Col>
                    <Col>
                        <Form.Control
                            type="input"
                            placeholder="Name"
                            name="key"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTextChange(e, index)}
                            value={property.key}
                        />
                    </Col>
                    <Col>
                        {props.type === TraitType.text ? (
                            <Form.Control
                                type="input"
                                placeholder="Value"
                                name="value"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTextChange(e, index)}
                                value={property.value as string}
                            />
                        ) : (
                            <InputGroup className="mb-2">
                                <Form.Control
                                    name="xOf"
                                    placeholder="3"
                                    value={(property.value as NumericVal).xOf}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(e, index)}
                                />
                                <InputGroup.Text>of</InputGroup.Text>
                                <Form.Control
                                    name="y"
                                    placeholder="5"
                                    value={(property.value as NumericVal).y}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNumericChange(e, index)}
                                />
                            </InputGroup>
                        )}
                    </Col>
                </Row>
            ))}

            <Row>
                <Col>
                    <Button size="sm" onClick={addMore} className={styles.addMore}>
                        Add more <i className="bi bi-plus-circle" />
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}
