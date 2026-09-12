import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Galeri Momen (MomentsGallery.tsx) memuat foto/video tamu dari Vercel
    // Blob (lib/moments.ts, app/api/moments/*) — subdomainnya unik per
    // store (mis. cijxkjbwgxozr0d6.public.blob.vercel-storage.com) dan
    // berubah kalau store dibuat ulang, jadi di-whitelist lewat wildcard
    // *.public.blob.vercel-storage.com, bukan domain spesifik yang bisa
    // basi. next/image dipakai supaya thumbnail grid di-resize otomatis
    // (bukan memuat file ~2MB penuh untuk kotak kecil), foto ASLI tetap
    // utuh saat diunduh (lib/compositor.ts tidak lewat next/image sama
    // sekali).
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
