import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Resim ayarları (Unsplash hatası için) */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  
  /* reactCompiler ayarını siliyoruz çünkü şu anki sürümde
     TypeScript hatası veriyor. İleride Next.js güncellendiğinde
     tekrar ekleyebilirsin.
  */
};

export default nextConfig;