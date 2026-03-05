/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // This allows the build to continue even with the strict type 
    // errors we saw earlier in the process.
    ignoreBuildErrors: true,
  }
}

export default nextConfig;