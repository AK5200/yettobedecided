/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Google user avatars (OAuth)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh4.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh5.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh6.googleusercontent.com' },
      // GitHub avatars
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // Supabase storage
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      // Gravatar
      { protocol: 'https', hostname: '*.gravatar.com' },
    ],
  },
}

export default nextConfig
