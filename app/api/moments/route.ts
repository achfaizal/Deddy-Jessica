import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

/**
 * Porting dari project glyka-virtual-photobooth, versi RINGKAS — di sana
 * rute ini query tabel Postgres `strips`/`sessions`/`assets` (dibuat saat
 * klaim kuota server-side). Playground ini TIDAK punya server-side
 * apa pun untuk sesi tamu (kuota cuma localStorage, lihat
 * lib/templates/index.ts), jadi tidak ada baris "sesi" untuk dijadikan
 * sumber listing. Sebagai gantinya, daftar momen dibaca LANGSUNG dari
 * tempat filenya disimpan:
 *  - mode blob (Vercel): `list()` @vercel/blob, filter prefix
 *    `moments/{code}/`.
 *  - mode local (`next dev`): baca folder public/moments-local/{code}/.
 * Foto (.png) + video (.mp4/.webm) + sidecar nama tamu (.json) yang
 * berbagi nama dasar (momentId) dikelompokkan jadi satu Moment.
 */
interface Moment {
  id: string;
  photoUrl?: string;
  videoUrl?: string;
  uploadedAt: string;
  guestName?: string;
}

const SAFE_ID = /^[A-Za-z0-9-]+$/;
const MOMENTS_DIR = path.join(process.cwd(), "public", "moments-local");

async function listFromBlob(code: string): Promise<Moment[]> {
  const prefix = `moments/${code}/`;
  const { blobs } = await list({ prefix });

  const byId = new Map<string, { photoUrl?: string; videoUrl?: string; uploadedAt: string; guestNameUrl?: string }>();
  for (const b of blobs) {
    const name = b.pathname.slice(prefix.length);
    const dot = name.lastIndexOf(".");
    if (dot < 0) continue;
    const id = name.slice(0, dot);
    const ext = name.slice(dot + 1).toLowerCase();
    const entry = byId.get(id) ?? { uploadedAt: b.uploadedAt.toISOString() };
    if (ext === "png") entry.photoUrl = b.url;
    else if (ext === "mp4" || ext === "webm") entry.videoUrl = b.url;
    else if (ext === "json") entry.guestNameUrl = b.url;
    byId.set(id, entry);
  }

  const moments: Moment[] = [];
  for (const [id, v] of byId) {
    let guestName: string | undefined;
    if (v.guestNameUrl) {
      // Sidecar kecil (bukan database) — kegagalan jaringan/format di
      // sini bukan alasan menyembunyikan foto/videonya sendiri.
      guestName = await fetch(v.guestNameUrl)
        .then((r) => r.json())
        .then((j: { guestName?: string }) => j.guestName)
        .catch(() => undefined);
    }
    moments.push({ id, photoUrl: v.photoUrl, videoUrl: v.videoUrl, uploadedAt: v.uploadedAt, guestName });
  }
  moments.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return moments;
}

async function listFromLocal(code: string): Promise<Moment[]> {
  const dir = path.join(MOMENTS_DIR, code);
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return []; // folder belum pernah dibuat = belum ada momen sama sekali
  }

  const byId = new Map<string, { photo?: string; video?: string; json?: string }>();
  for (const name of names) {
    const dot = name.lastIndexOf(".");
    if (dot < 0) continue;
    const id = name.slice(0, dot);
    const ext = name.slice(dot + 1).toLowerCase();
    const entry = byId.get(id) ?? {};
    if (ext === "png") entry.photo = name;
    else if (ext === "mp4" || ext === "webm") entry.video = name;
    else if (ext === "json") entry.json = name;
    byId.set(id, entry);
  }

  const moments: Moment[] = [];
  for (const [id, v] of byId) {
    if (!v.photo) continue; // tanpa foto, bukan momen (sidecar/video yatim)
    const st = await stat(path.join(dir, v.photo)).catch(() => null);
    let guestName: string | undefined;
    if (v.json) {
      guestName = await readFile(path.join(dir, v.json), "utf-8")
        .then((raw) => (JSON.parse(raw) as { guestName?: string }).guestName)
        .catch(() => undefined);
    }
    moments.push({
      id,
      photoUrl: `/moments-local/${code}/${v.photo}`,
      videoUrl: v.video ? `/moments-local/${code}/${v.video}` : undefined,
      uploadedAt: (st?.mtime ?? new Date()).toISOString(),
      guestName,
    });
  }
  moments.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return moments;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventCode = searchParams.get("event")?.toUpperCase();
  if (!eventCode || !SAFE_ID.test(eventCode)) {
    return NextResponse.json({ error: "Parameter event wajib diisi." }, { status: 400 });
  }

  try {
    const moments = process.env.VERCEL
      ? await listFromBlob(eventCode)
      : await listFromLocal(eventCode);
    return NextResponse.json({ moments });
  } catch {
    // Playground ini tanpa database — kalau listing gagal dibaca (Blob
    // API bermasalah, dsb), galeri tampil kosong daripada mengganggu
    // tamu yang cuma mau lihat/unduh strip-nya sendiri (K14 pattern yang
    // sama dipakai di seluruh playground ini).
    return NextResponse.json({ moments: [] });
  }
}
