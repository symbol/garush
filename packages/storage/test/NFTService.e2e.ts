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
import 'mocha';
import { Account, MosaicId, NetworkType, RepositoryFactoryHttp } from 'symbol-sdk';
import { StorageService } from '../src';
import { NFTService } from '../src/NFTService';

const mainnetRepositoryFactory = new RepositoryFactoryHttp('http://ngl-dual-601.symbolblockchain.io:3000');
const testnetRepositoryFactory = new RepositoryFactoryHttp('https://ngl-dual-101.testnet.symboldev.network:3001');
const repositoryFactory = new RepositoryFactoryHttp('http://demo-001.garush.dev:3000');
const signerAccount = Account.createFromPrivateKey(
    '0F1F0D1B17E115C507543CEC0D75A2686B81F35756AA729F3B88CFEF595690EC',
    NetworkType.TEST_NET,
);
const recipientAccount = Account.createFromPrivateKey(
    'DE189D5F94437E3FAF151CD4F1EE0CCD777FDA0A3D268F5743F4D08DEDC27A75',
    NetworkType.TEST_NET,
);

describe('NFTService', () => {
    it('get one art into garush net', async () => {
        //50E6969F358B653B
        //1D6E695EA6C6EA31
        //4EF18BE1687BB030
        console.log(recipientAccount.address.plain());
        const nftService = new NFTService(mainnetRepositoryFactory);
        const mosaicId = new MosaicId('50E6969F358B653B');
        const nemberArtMosaic = await nftService.takeNemberArt(mosaicId);
        const url = `https://ipfs.io/ipfs/${nemberArtMosaic.matadata.data.media.ipfs}`;
        console.log('Downloading file');
        const downloadedFile = await nftService.downloadFile(url);
        console.log(downloadedFile.content.length);
        const service = new StorageService(repositoryFactory);
        const feeMultiplier = 1000;
        const content = downloadedFile.content;
        console.log('Uploading file');
        await service.storeImage({
            signerPrivateAccount: signerAccount.privateKey,
            recipientPublicAccount: recipientAccount.publicKey,
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
});
