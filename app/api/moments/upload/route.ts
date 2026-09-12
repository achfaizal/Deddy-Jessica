import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * Token upload dikeluarkan di server (route ini), tapi byte filenya lewat
 * langsung dari browser tamu ke Vercel Blob — TIDAK numpang lewat body
 * request Next.js. Video pesan suara bisa sampai ~10MB (15 detik pada
 * bitrate rekaman default), jauh di atas batas body request Vercel
 * Functions (4.5MB), jadi upload sisi-server biasa bukan opsi di sini.
 *
 * Porting dari project glyka-virtual-photobooth, versi RINGKAS: di sana
 * `onUploadCompleted` juga menulis baris ke Postgres (tabel `assets`,
 * `markStripUploaded`) — playground ini SENGAJA tanpa database (lihat
 * CLAUDE.md §2), jadi blok itu dihapus. File tetap tersimpan permanen di
 * Blob; listing-nya (lib/moments.ts fetchMoments) dibaca langsung dari
 * Blob API lewat GET /api/moments, bukan dari tabel.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("moments/")) {
          throw new Error("Path upload tidak valid.");
        }
        return {
          // Wildcard, bukan exact-match — MediaRecorder mengeluarkan
          // contentType lengkap dengan codec (mis. "video/mp4;codecs=avc1,
          // mp4a.40.2"), yang tidak akan pernah cocok exact-match "video/mp4".
          // application/json: sidecar kecil berisi nama tamu (lihat
          // lib/moments.ts uploadToBlob).
          allowedContentTypes: ["image/png", "video/*", "application/json"],
          addRandomSuffix: false,
          allowOverwrite: true,
          maximumSizeInBytes: 30 * 1024 * 1024,
        };
      },
      // onUploadCompleted SENGAJA tidak diisi — tidak ada database di
      // playground ini untuk dicatat. File sudah aman tersimpan di Blob
      // begitu handleUpload selesai; itu satu-satunya "sumber kebenaran"
      // untuk galeri Momen di sini.
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload gagal." },
      { status: 400 }
    );
  }
}
