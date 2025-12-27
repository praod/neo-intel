/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Exclude Supabase Edge Functions from webpack compilation
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    // Ignore Supabase functions directory
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/supabase/functions/**'],
    }
    return config
  },
  // Exclude Supabase functions from page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
}

module.exports = nextConfig

