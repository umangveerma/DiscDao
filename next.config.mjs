/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; connect-src 'self' https://api.dscvr.one https://api1.stg.dscvr.one https://*.helius-rpc.com https://*.ipfscdn.io;"
          },
        ],
      },
    ]
  },
}

export default nextConfig
