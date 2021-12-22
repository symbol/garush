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
import Traits, { TraitType } from '@components/Traits/Traits';
import React from 'react';
import { Form, Button, Container } from 'react-bootstrap';

interface CreatePageProps {}

export default function createPage(props: CreatePageProps) {
    return (
        <Container>
            <h2>Create New Item</h2>
            <Form>
                <Form.Group className="mb-3" controlId="formFile">
                    <Form.Label>PNG Image</Form.Label>
                    <Form.Control type="file" placeholder="Click select button or drag and drop the file here" />
                    <Form.Text className="text-muted">Max File Size: 100 MB</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formName">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="input" placeholder="Item name" required />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formDescription" required>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        type="input"
                        as="textarea"
                        placeholder="Provide a detailed description of your item"
                        aria-describedby="descriptionHelp"
                    />
                    <Form.Text id="descriptionHelp" muted>
                        The description will be included on the item&apos;s detail page underneath its image. Markdown syntax is supported.
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formExternalLink">
                    <Form.Label>External Link</Form.Label>
                    <Form.Control type="input" placeholder="https://my-awesome-site/item/123" aria-describedby="externalLinkHelp" />
                    <Form.Text id="externalLinkHelp" muted>
                        Garush will include a link to this URL on this item&apos;s detail page, so that users can click to learn more about
                        it. You are welcome to link to your own webpage with more details.
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formCollection">
                    <Form.Label>Collection</Form.Label>
                    <Form.Select size="lg" aria-describedby="collectionHelp">
                        <option>Collection 1</option>
                        <option>Collection 2</option>
                    </Form.Select>
                    <Form.Text id="collectionHelp" muted>
                        This is the collection where your item will be displayed.
                    </Form.Text>
                </Form.Group>

                <Traits type={TraitType.text} />
                <Traits type={TraitType.numeric} />
                <Traits type={TraitType.stats} />

                <Button variant="primary" type="submit">
                    Submit
                </Button>
            </Form>
        </Container>
    );
}
