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
import { expect } from 'chai';
import { readFileSync } from 'fs';
import 'mocha';
import { firstValueFrom } from 'rxjs';
import { Account, Convert, Deadline, EmptyMessage, NetworkType, RepositoryFactoryHttp, TransferTransaction } from 'symbol-sdk';
import { StorageService } from '../src';

const networkType = NetworkType.TEST_NET;
const epochAdjustment = 1634235224;
const generationHash = '8E994B5DD6798CD34FEABE4B293DF355011E94CE8AADE8985FD6E736ACD94DC4';
const repositoryFactory = new RepositoryFactoryHttp('http://demo-001.garush.dev:3000', {
    epochAdjustment: epochAdjustment,
    generationHash: generationHash,
    networkType: networkType,
});

const signerAccount = Account.createFromPrivateKey('0F1F0D1B17E115C507543CEC0D75A2686B81F35756AA729F3B88CFEF595690EC', networkType);
const recipientAccount = Account.createFromPrivateKey('CE189D5F94437E3FAF151CD4F1EE0CCD777FDA0A3D268F5743F4D08DEDC27A75', networkType);
const faucetAccount = Account.createFromPrivateKey('B0D4062A75A84B64A3881C6AA2B1FCD03628604754B64748F31C035E4E5C20A7', networkType);
const service = new StorageService(repositoryFactory);

describe('StorageService', () => {
    async function storeFile(fileName: string, fileMimeType: string) {
        console.log(`Signer private key ${signerAccount.privateKey}`);
        console.log(`Signer address ${signerAccount.address.plain()}`);
        console.log(`Recipient private key ${recipientAccount.privateKey}`);
        console.log(`Recipient address ${recipientAccount.address.plain()}`);

        const feeMultiplier = 1000;
        const content = await readFileSync(`${__dirname}/images/${fileName}`);
        console.log(fileMimeType);
        await service.storeFile({
            signerPrivateAccount: signerAccount.privateKey,
            recipientPublicAccount: recipientAccount.publicKey,
            content: content,
            name: fileName,
            mime: fileMimeType,
            feeMultiplier: feeMultiplier,
        });
    }

    it('e2e storage maradona.png', () => {
        return storeFile('maradona.png', 'image/png');
    });

    it('e2e storage mj.gif', () => {
        return storeFile('mj.gif', 'image/gif');
    });

    it('e2e storage syndicate.png', () => {
        return storeFile('syndicate.png', 'image/png');
    });
    it('e2e storage file_example_MP3_1MG.mp3', () => {
        return storeFile('file_example_MP3_1MG.mp3', 'audio/mp3');
    });

    it('send some tokens from faucet', async () => {
        console.log(faucetAccount.address.plain());
        const deadline = Deadline.create(epochAdjustment);
        const currency = await firstValueFrom(repositoryFactory.getCurrencies());

        const transfer = TransferTransaction.create(
            deadline,
            signerAccount.address,
            [currency.currency.createRelative(10000)],
            EmptyMessage,
            networkType,
        ).setMaxFee(1000);
        await service.announceAll([faucetAccount.sign(transfer, generationHash)]);
    });

    it('load all images', async () => {
        const metadatas = await service.loadFilesMetadata(recipientAccount.address);
        console.log(metadatas);
    });

    it('load image', async () => {
        const image = await service.loadFileFromHash('3DDBA6E3C08B35FE624D4801B6D376A8636999C9B03F4EA2D7560879BE43E74A');
        console.log(image.metadata.name);
        const expectedImage = await readFileSync(`${__dirname}/images/${image.metadata.name}`);
        expect(Convert.uint8ToHex(expectedImage)).eq(Convert.uint8ToHex(image.content));
    });

    it('loadImagesMetadata', async () => {
        const images = await service.loadFilesMetadata(recipientAccount.address);
        console.log(images);
    });
});
