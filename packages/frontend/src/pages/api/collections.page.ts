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
import type { NextApiHandler } from 'next';

const collectionsHandler: NextApiHandler = async (request, response) => {
    // simulate IO latency
    //await new Promise((resolve) => setTimeout(resolve, 1000));

    const collection = {
        id: '1',
        name: 'Coll ',
        floorPrice: '$100',
        listingPrice: '$200',
        likes: '100',
        imageUrl: 'https://picsum.photos/180',
        description: 'Description',
    };
    const collections = Array(6)
        .fill(collection)
        .map((c, inx) => ({
            ...c,
            id: inx + 1,
            name: c.name + (inx + 1),
            description: c.description + (inx + 1),
            listingPrice: Math.floor(100 * Math.random()),
            floorPrice: Math.floor(100 * Math.random()),
            likes: '' + Math.floor(1000 * Math.random()),
        }));

    response.json(collections);
};

export default collectionsHandler;
