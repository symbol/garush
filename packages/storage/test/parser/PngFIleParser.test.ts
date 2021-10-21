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
import * as _ from 'lodash';
import 'mocha';
import { Convert } from 'symbol-sdk';
import { FileParserManager, PngFileParser } from '../../src';

describe('PngFileParser', () => {
    it('split and join maradona.png', async () => {
        const fileName = 'maradona.png';
        const manager = new FileParserManager();
        const parser = manager.getFileParser('png') as PngFileParser;
        const filePath = `${__dirname}/../images/${fileName}`;
        const content = await readFileSync(filePath);

        const { multiLevelChunks } = await parser.split(content);
        const chunks = _.flatMap(multiLevelChunks);

        expect(chunks.length).eq(27);
        console.log(chunks.map((c) => c.length));
        expect(Convert.uint8ToHex(chunks[0])).eq('89504E470D0A1A0A'); // PNG SIGNATURE
        expect(Convert.uint8ToHex(chunks[1])).eq('0000000D4948445200000168000001BE0803000000895C6ED5'); // HEADER
        expect(Convert.uint8ToHex(chunks[2])).eq(
            '0000009C504C5445EEEEEEEAEAEA2B2C2EFECB921D1D1E231000383837FFFFFF0D0C0C15151580808003020292CAFF434343929290FD9E34FDAA4D505050C1C1C0D0D1D1F7FAFBF7F3EEFFD7AAE0F1FFA1A29F49270360605FDEDFDEFFE3C3FEC18170706FB1B2B0FEB76B2999FF6FBCFFCF69070668D1351D07158BFEA4D9FE075BB29A8065063D777E4A17C1E5FC9E6B364D6E8F54ABFCDD8B34CDA47A5E8CBA84AFDABCBA0D64',
        ); // PNG FIRST IDAT
        expect(Convert.uint8ToHex(chunks[3])).eq(
            '000020004944415478DAECDD0B7B9ACA160660C0D90CC300CA3008810826D9A9C7231A2FFFFFBF9D35032ADE5AD0EC53F7D3354DD3D495903EAF2B1F3308D4A0A7C3381D58FDAE2A722034426315A1111AA19103A1111AAB088DD0088D1C088DD05845E8A785461D6C7084C62A422334569103A1111AAB088DD058450E844668AC223442FFE155D4C11646E87FA41AC7925219CB3846E87FB04A293807824A29E38B12427F4B5594428832B02C8B10F5CE0A4A78A42C0D84FEC6AA91670E6F0F0746FD5189D0DF577589B2D5BA8C31C7693E600E7C6C09F51912A1BFA15AE816065802BFF468A0D5E056993142DC52D018A11FA90AABEEE5431F9F0D1522EA3729CFBE1AA1FB54E382F0A3F355E9436B673945E85ED538AE53009237ECC8AC5A9BFB27D208FDABAA14415C978293763E9A92EBD24E685289D0DDA1A35471D128FC493A939A9B9C4ADBAE8C11BA7B74282D9ADBFCAA33F9597A38822274AF2A35C3B3D8203790DBBDEDF0F0DF0DFD1BFE1DC18973ABAB9D6BDCFB093640E342B157D520FC94F96459484E53A4FE240D6DE508DDABEA9ECCEBF6D06791EDB4A0EB7AEBE0074277A9B61BDAB968ED73F363193BBA67F55A435F8776DAD09CFB98D17DAAE555E7EBE62AB1F71FF12C42E83E55BF0FF4B1BD1977F1F0749F6A4C7EE57C439D1708DDEB483FEF077D189CE508DDA31ADC0DED9408DDBD6AD8CEBD0357867DAAE6BD0D0DD07684D09DABF1FDD00E2708DDB92A9CFB07E7014277AD86FC11694BE2D9A4DDAAB05C79A8A5238A2DDC0D3A7820A3013AA331427782CE9D875ABA79390BA17F558DE56321CD4B84EE56A582F19F1C43EAB03B8C11BA4B554AEB21684611BA5BF5FEA34ACD9A05A13B42E73642FF5FBE318DEC4756E198D19DAB3427FC814538CE3ABA56A5BC179A73DBC0E8E80E6D907B1BDAA7914B11BA3BF4BD1D6D4B979912A11F81669DA2C30FB93A231DA1BB41B37356C6BA86B43AAE84679376AC4AEB0C5AC1BFB0CE398D07FE3B5693E5F2DC992F461D835B1D9346E8AED0EB33D4F562395A74DC43AAD7B310BA23F4F0B37D86B4CF96EBE570DDF1E8927A8916A1BB427FF056164CC297E170F8D115DA42E8AED5F4D0D29C87CE7AE0D7D00E76F47757B39A9571BE1CCC37035B41775D2EAA931D11BA633578193287C3DB723259901ABAF3541A671DDDAFCAB2EC3523CBF56736984E877CBA61C361E7490742F7A94A023D3C9C4E34F466C2D7A365D795618A0B963ED04E033D5F434703B44A0EC27EA9CCED144F09BB077A32F13F1C7FC2874BCE7E76C4836867AB88F0DCBB3BA047003D268B21B7F9F0A57DADDB75E750E0F9D1774243430FD4626541862F8BCF9F2C58D4C56FE1BF8DF279A0A7D0D103880D65FEB97879B93DF160753F67818B6793F6AACA9C37D0930D5F2AE9CFC5501F56BA161F8CE98B39',
        ); // PNG FIRST IDAT
        expect(Convert.uint8ToHex(chunks[chunks.length - 1])).eq('0000000049454E44AE426082'); // PNG END

        const joinedBackContent = await parser.join(multiLevelChunks);
        expect(Convert.uint8ToHex(joinedBackContent)).deep.eq(Convert.uint8ToHex(content));
    });

    it('PNG getMetadata maradona.png', async () => {
        const fileName = 'maradona.png';
        const manager = new FileParserManager();
        const parser = manager.getFileParser('png') as PngFileParser;
        const filePath = `${__dirname}/../images/${fileName}`;
        const content = await readFileSync(filePath);

        const metadata = parser.getMetadata(content);
        expect(metadata).deep.eq({
            alpha: false,
            color: true,
            colorType: 3,
            compr: 0,
            depth: 8,
            filter: 0,
            height: 446,
            interlace: false,
            palette: true,
            width: 360,
        });
    });

    it('split and join TONGARI COINER.png', async () => {
        const fileName = 'TONGARI COINER.png';
        const manager = new FileParserManager();
        const parser = manager.getFileParser('png') as PngFileParser;
        const filePath = `${__dirname}/../images/${fileName}`;
        const content = await readFileSync(filePath);

        const { multiLevelChunks } = await parser.split(content);
        const chunks = _.flatMap(multiLevelChunks);

        expect(chunks.length).eq(127);

        const joinedBackContent = await parser.join(multiLevelChunks);
        expect(Convert.uint8ToHex(joinedBackContent)).deep.eq(Convert.uint8ToHex(content));
    });
});
