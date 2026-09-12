/**
 * MOMEN TAMU
 *
 * Diporting dari project glyka-virtual-photobooth (2026-09-13) — sebelumnya
 * modul ini murni IndexedDB per-perangkat (lihat riwayat git), yang berarti
 * "galeri momen" cuma kelihatan dari HP yang sama, tidak pernah tersimpan
 * ke satu tempat untuk semua tamu. Untuk acara sungguhan (wedding.ts,
 * dipakai banyak tamu berbeda HP bersamaan), foto/video sekarang diunggah
 * ke server supaya benar-benar terkumpul di satu tempat.
 *
 * Dua mode penyimpanan tergantung lingkungan (dicek di server lewat
 * /api/moments/config, lihat catatan di sana):
 *
 *  - Local dev (`next dev` di komputer sendiri): ditulis ke
 *    public/moments-local/ di filesystem lokal, lewat upload biasa ke
 *    /api/moments/upload-local. Testing jadi tidak numpang di data tamu
 *    sungguhan.
 *  - Production di Vercel: Vercel Blob, lewat upload langsung
 *    browser→Blob (bukan lewat body request Next.js) karena video pesan
 *    suara bisa sampai ~10MB, di atas batas body request Vercel Functions
 *    (4.5MB).
 *
 * ⚠️ Beda dari glyka-virtual-photobooth: versi INI tidak punya Postgres
 * sama sekali (playground ini sengaja tanpa database, CLAUDE.md §2).
 * Listing momen (fetchMoments) dibaca LANGSUNG dari Blob API / filesystem
 * lokal lewat GET /api/moments (lihat app/api/moments/route.ts), bukan
 * dari tabel `strips`/`sessions`/`assets`. Nama tamu dititipkan lewat
 * sidecar JSON kecil per momen, bukan kolom database.
 *
 * photoUrl/videoUrl yang dikembalikan fetchMoments() SEKARANG url server
 * asli (Blob URL publik / path /moments-local/...), BUKAN lagi object URL
 * lokal (`URL.createObjectURL`) — MomentsGallery.tsx masih memanggil
 * `URL.revokeObjectURL()` atas url ini saat galeri ditutup (peninggalan
 * versi IndexedDB lama); itu no-op aman untuk url yang bukan skema
 * `blob:`, jadi sengaja tidak dihapus supaya tidak menyentuh komponen
 * cuma untuk pembersihan yang sudah aman dengan sendirinya.
 */
import { upload } from "@vercel/blob/client";

export interface Moment {
  id: string;
  photoUrl?: string;
  videoUrl?: string;
  uploadedAt: string;
  /** Nama tamu yang mengambil momen ini, kalau diisi saat sesi. */
  guestName?: string;
}

async function storageMode(): Promise<"blob" | "local"> {
  try {
    const res = await fetch("/api/moments/config");
    const data = (await res.json()) as { mode?: "blob" | "local" };
    return data.mode === "blob" ? "blob" : "local";
  } catch {
    return "local";
  }
}

async function uploadToBlob(
  code: string,
  momentId: string,
  photo: Blob,
  video?: Blob | null,
  guestName?: string
) {
  await upload(`moments/${code}/${momentId}.png`, photo, {
    access: "public",
    handleUploadUrl: "/api/moments/upload",
    contentType: "image/png",
  });

  if (video) {
    // video.type dari MediaRecorder ikut membawa parameter codec (mis.
    // "video/mp4;codecs=avc1,mp4a.40.2") — dipakai untuk deteksi ekstensi
    // saja, bukan dikirim apa adanya sebagai contentType.
    const ext = video.type.includes("mp4") ? "mp4" : "webm";
    await upload(`moments/${code}/${momentId}.${ext}`, video, {
      access: "public",
      handleUploadUrl: "/api/moments/upload",
      contentType: `video/${ext}`,
    });
  }

  // Sidecar kecil berisi nama tamu — dibaca ulang GET /api/moments
  // (versi glyka menulis ini ke Postgres `sessions.guest_name`, yang
  // tidak ada di playground ini).
  if (guestName) {
    const sidecar = new Blob([JSON.stringify({ guestName })], { type: "application/json" });
    await upload(`moments/${code}/${momentId}.json`, sidecar, {
      access: "public",
      handleUploadUrl: "/api/moments/upload",
      contentType: "application/json",
    });
  }
}

async function uploadToLocal(
  code: string,
  momentId: string,
  photo: Blob,
  video?: Blob | null,
  guestName?: string
) {
  const form = new FormData();
  form.set("eventCode", code);
  form.set("momentId", momentId);
  form.set("photo", photo, "photo.png");
  if (video) form.set("video", video, "video.webm");
  if (guestName) form.set("guestName", guestName);

  const res = await fetch("/api/moments/upload-local", { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload momen (local) gagal.");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Unggah gagal → coba ulang otomatis 3 kali dengan jeda menaik. Tetap
    gagal → dilempar ke pemanggil (StepResult.tsx membungkusnya try/catch
    dan diam-diam melanjutkan — tamu tetap dapat struknya sendiri lewat
    unduhan manual, K14 "gagal pelan" yang sama dipakai di seluruh
    playground ini). Tidak ada penandaan "pending_upload" server-side di
    sini — itu butuh baris sesi Postgres yang tidak ada di playground ini. */
export async function uploadMoment({
  eventCode,
  momentId,
  photo,
  video,
  guestName,
}: {
  eventCode: string;
  momentId: string;
  photo: Blob;
  video?: Blob | null;
  guestName?: string;
}): Promise<void> {
  const code = eventCode.toUpperCase();
  const mode = await storageMode();
  const attempt = () =>
    mode === "blob"
      ? uploadToBlob(code, momentId, photo, video, guestName)
      : uploadToLocal(code, momentId, photo, video, guestName);

  const delaysMs = [1000, 3000, 8000]; // jeda menaik, 3 percobaan
  let lastError: unknown;
  for (let i = 0; i <= delaysMs.length; i++) {
    try {
      await attempt();
      return;
    } catch (e) {
      lastError = e;
      if (i < delaysMs.length) await sleep(delaysMs[i]);
    }
  }
  throw lastError;
}

export async function fetchMoments(eventCode: string): Promise<Moment[]> {
  const res = await fetch(`/api/moments?event=${encodeURIComponent(eventCode)}`);
  if (!res.ok) throw new Error("Momen belum bisa dimuat.");
  const data = (await res.json()) as { moments?: Moment[] };
  return data.moments ?? [];
}
