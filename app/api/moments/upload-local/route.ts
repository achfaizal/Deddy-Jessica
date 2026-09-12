import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/**
 * Cuma dipakai saat `next dev` di komputer sendiri (lihat
 * app/api/moments/config) — momen ditulis ke public/moments-local/ di
 * filesystem lokal, bukan Vercel Blob, supaya testing tidak numpang di
 * data tamu sungguhan. Route ini sengaja menolak jalan kalau ternyata
 * di-deploy ke Vercel: filesystem-nya read-only & sementara di sana, jadi
 * upload akan terlihat "berhasil" padahal filenya lenyap begitu request
 * selesai — lebih baik gagal jelas daripada gagal diam-diam.
 *
 * Porting dari project glyka-virtual-photobooth, versi RINGKAS: TIDAK ada
 * stripImageMetadata() (util itu tidak ada di playground ini) dan TIDAK
 * ada penulisan ke Postgres (`assets`/`markStripUploaded`) — playground
 * ini sengaja tanpa database (CLAUDE.md §2). guestName dilampirkan sebagai
 * sidecar JSON kecil ({momentId}.json) di folder yang sama, dibaca lagi
 * oleh GET /api/moments (bukan dari Postgres seperti versi asal).
 */
const SAFE_ID = /^[A-Za-z0-9-]+$/;
const MOMENTS_DIR = path.join(process.cwd(), "public", "moments-local");

export async function POST(request: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "Route ini cuma untuk local dev, bukan Vercel." },
      { status: 400 }
    );
  }

  const form = await request.formData();
  const eventCode = String(form.get("eventCode") ?? "").toUpperCase();
  const momentId = String(form.get("momentId") ?? "");
  const photo = form.get("photo");
  const video = form.get("video");
  const guestName = form.get("guestName");

  if (!SAFE_ID.test(eventCode) || !SAFE_ID.test(momentId)) {
    return NextResponse.json({ error: "eventCode/momentId tidak valid." }, { status: 400 });
  }
  if (!(photo instanceof File)) {
    return NextResponse.json({ error: "File foto wajib diisi." }, { status: 400 });
  }

  const dir = path.join(MOMENTS_DIR, eventCode);
  await mkdir(dir, { recursive: true });

  await writeFile(path.join(dir, `${momentId}.png`), Buffer.from(await photo.arrayBuffer()));

  if (video instanceof File) {
    const ext = video.type.includes("mp4") ? "mp4" : "webm";
    await writeFile(path.join(dir, `${momentId}.${ext}`), Buffer.from(await video.arrayBuffer()));
  }

  // Sidecar kecil, bukan database — satu-satunya jalan versi ringkas ini
  // menyimpan nama tamu (versi asal glyka menulisnya ke Postgres
  // `sessions.guest_name`, yang tidak ada di playground ini).
  if (typeof guestName === "string" && guestName.trim()) {
    await writeFile(
      path.join(dir, `${momentId}.json`),
      JSON.stringify({ guestName: guestName.trim() })
    );
  }

  return NextResponse.json({ ok: true });
}
