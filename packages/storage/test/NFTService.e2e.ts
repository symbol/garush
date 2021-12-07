/*
 * Copyright 2020 NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { readFileSync } from 'fs';
import 'mocha';
import { Account, MosaicId, NetworkType, RepositoryFactoryHttp, UInt64 } from 'symbol-sdk';
import { StorageService } from '../src';
import { NFTService } from '../src/NFTService';

const mainnetRepositoryFactory = new RepositoryFactoryHttp('https://symbol-node-dual-1.tawa.solutions:3001');
const testnetRepositoryFactory = new RepositoryFactoryHttp('https://001-joey-dual.symboltest.net:3001');
const garushRepositoryFactory = new RepositoryFactoryHttp('https://dual-001.garush.dev:3001');
const brokerAccount = Account.createFromPrivateKey(
    '5F1ED8B6632D4B2AAE5591ED12A75FDC29D272015DDB11280E6DD640653B958C',
    NetworkType.TEST_NET,
);
const artistAccount = Account.createFromPrivateKey(
    'D6258BF87DA39CCA0DFB8EF99C18FCDDCED7D8EA25D000087C02E2C0097A2144',
    NetworkType.TEST_NET,
);

const buyerAccount = Account.createFromPrivateKey('384A1EA8B18596CCE82E0E0FED55F6AA8FEF070008518477D8398CE64813A393', NetworkType.TEST_NET);

console.log(`Broker private key ${brokerAccount.privateKey}`);
console.log(`Broker address ${brokerAccount.address.plain()}`);
console.log(`Artist private key ${artistAccount.privateKey}`);
console.log(`Artist address ${artistAccount.address.plain()}`);
console.log(`Buyer private key ${buyerAccount.privateKey}`);
console.log(`Buyer address ${buyerAccount.address.plain()}`);

describe('NFTService', () => {
    it('get one art into garush net', async () => {
        //50E6969F358B653B
        //1D6E695EA6C6EA31
        //4EF18BE1687BB030
        const nftService = new NFTService(mainnetRepositoryFactory, mainnetRepositoryFactory);
        const mosaicId = new MosaicId('50E6969F358B653B');
        const nemberArtMosaic = await nftService.takeNemberArt(mosaicId);
        const url = `https://ipfs.io/ipfs/${nemberArtMosaic.matadata.data.media.ipfs}`;
        console.log('Downloading file');
        const downloadedFile = await nftService.downloadFile(url);
        console.log(downloadedFile.content.length);
        const service = new StorageService(garushRepositoryFactory);
        const feeMultiplier = 1000;
        const content = downloadedFile.content;
        console.log('Uploading file');
        await service.storeFile({
            signerPrivateAccount: brokerAccount.privateKey,
            recipientPublicAccount: artistAccount.publicKey,
            content: content,
            name: nemberArtMosaic.matadata.data.meta.name,
            mime: downloadedFile.mime,
            feeMultiplier: feeMultiplier,
            userData: {
                description: nemberArtMosaic.matadata.data.meta.description,
                mosaicId: mosaicId.id.toHex(),
                ipfs: nemberArtMosaic.matadata.data.media.ipfs,
                message: 'I survived NemberArt',
            },
        });
    });
    async function createArt(fileName: string, fileMimeType: string) {
        const feeMultiplier = 1000;
        const content = await readFileSync(`${__dirname}/images/${fileName}`);
        console.log(fileMimeType);
        return new NFTService(testnetRepositoryFactory, garushRepositoryFactory).createArt({
            garushNetwork: true,
            brokerPrivateAccount: brokerAccount.privateKey,
            artistPrivateAccount: artistAccount.privateKey,
            description: 'Some description in test!',
            content: content,
            name: fileName,
            mosaicDuration: 0,
            mime: fileMimeType,
            feeMultiplier: feeMultiplier,
        });
    }

    async function sellArt(rootTransactionHash: string) {
        const feeMultiplier = 1000;
        return new NFTService(testnetRepositoryFactory, garushRepositoryFactory).sellArt({
            brokerPrivateAccount: brokerAccount.privateKey,
            artistPrivateAccount: artistAccount.privateKey,
            mosaicDuration: 0,
            percentage: 4,
            buyerPrivateAccount: buyerAccount.privateKey,
            rootTransactionHash: rootTransactionHash,
            feeMultiplier: feeMultiplier,
            price: UInt64.fromUint(20000000),
        });
    }

    it('e2e storage maradona.png nft', () => {
        return createArt('maradona.png', 'image/png');
    });

    it('e2e storage nem-small.jpg nft', async () => {
        const garushFile = await createArt('nem-small.jpg', 'image/jpg');
        return sellArt(garushFile.rootTransactionHash);
    });

    it('e2e sell maradona.png nft', async () => {
        return sellArt('C365EBD6D5FE009BC8A9C61230AE08AF84B231D592A0B7A7CC03BC3081C40871');
    });

    it('e2e sell nem-small.jpg nft', async () => {
        return sellArt('DFDA29C5CBAB564677281A8C50EF7EF02154940FAE8A2E710D5BFF591916B76A');
    });
});
