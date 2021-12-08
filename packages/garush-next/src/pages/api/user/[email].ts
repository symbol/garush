import type { NextApiHandler } from 'next'

const userHandler: NextApiHandler = async (request, response) => {
  const { email } = request.query;

  // simulate IO latency
  await new Promise((resolve) => setTimeout(resolve, 500))

  response.json({
    id: 1,
    name: 'garush',
    email: 'baha@symbol.dev',
    avatar: 'https://avatars0.githubusercontent.com/u/1234?s=460&v=4',
    walletAddress: '0x123456789',
    isActive: true,
    loggedIn: true,
})
}

export default userHandler;
