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

const userHandler: NextApiHandler = async (request, response) => {
    const { email } = request.query;

    // simulate IO latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    response.json({
        id: 1,
        name: 'garush',
        email: 'user@example.com',
        avatar: 'https://avatars0.githubusercontent.com/u/1234?s=460&v=4',
        walletAddress: '0x123456789',
        isActive: true,
        loggedIn: true,
    });
};

export default userHandler;
