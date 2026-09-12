/**
 * ACARA TERSIMPAN — hasil kustomisasi user lewat Builder
 * (app/dashboard/builder/[templateId]).
 *
 * Belum ada backend/akun (lihat app/dashboard/layout.tsx), jadi satu
 * "instance" = satu acara yang sudah diisi (nama/tanggal/venue/dst),
 * diturunkan dari satu PlaygroundTemplate, disimpan sebagai baris di
 * localStorage — pola §9 UI-UX-DESIGN-SYSTEM.md (localStorage + custom
 * `window` event untuk sinkronisasi antar komponen, bukan Blob seperti
 * Momen di lib/moments.ts, jadi localStorage cukup di sini, tidak perlu
 * IndexedDB).
 *
 * Tamu mengakses hasilnya di /e/[id] (app/e/[id]/page.tsx) — beda dari
 * /t/[id] yang selalu menampilkan template BAWAAN apa adanya.
 */
import type { EventConfig, Template } from "../templates";

export interface EventInstance {
  /** Dipakai di URL tamu (/e/<id>). */
  id: string;
  /** PlaygroundTemplate asal (lib/templates/index.ts) — sumber bingkai
      default & tema dasar sebelum override user. */
  templateId: string;
  event: EventConfig;
  createdAt: number;
  updatedAt: number;
}

const KEY = "circlesnap-playground:instances";
/** Nama event DOM "instance berubah" — pola sama dengan EVENT_SAVED di
    lib/utils.ts (§9), dipisah supaya pendengar tidak perlu tahu soal
    Momen sama sekali kalau cuma mau tahu soal acara. */
export const INSTANCES_CHANGED = "circlesnap:instances-changed";

function readAll(): EventInstance[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as EventInstance[]) : [];
  } catch {
    // localStorage rusak/diblokir — gagal pelan ke daftar kosong, jangan
    // sampai satu baris korup mengunci seluruh dashboard.
    return [];
  }
}

function writeAll(rows: EventInstance[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(INSTANCES_CHANGED));
}

export function listInstances(): EventInstance[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getInstance(id: string): EventInstance | undefined {
  return readAll().find((r) => r.id === id);
}

/** Baru kalau `id` belum ada, timpa kalau sudah — dipakai builder untuk
    "Simpan" berkali-kali pada acara yang sama tanpa bikin duplikat. */
export function upsertInstance(
  id: string,
  templateId: string,
  event: EventConfig
): EventInstance {
  const rows = readAll();
  const now = Date.now();
  const existing = rows.find((r) => r.id === id);
  const next: EventInstance = existing
    ? { ...existing, event, updatedAt: now }
    : { id, templateId, event, createdAt: now, updatedAt: now };

  writeAll(existing ? rows.map((r) => (r.id === id ? next : r)) : [...rows, next]);
  return next;
}

export function deleteInstance(id: string): void {
  writeAll(readAll().filter((r) => r.id !== id));
}

/** ID pendek acak (bukan UUID penuh) — ini tampil di URL yang dibagikan
    tamu lewat QR, lebih ramah diketik ulang manual kalau QR-nya gagal
    dipindai. Tabrakan cukup diabaikan: ruang 36^8 jauh lebih besar dari
    jumlah acara yang realistis dibuat satu browser. */
export function createInstanceId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* --------------------------------------------------------- draft pratinjau
   Builder (app/dashboard/builder/[templateId]) menulis draft yang SEDANG
   diketik ke sini — TERPISAH dari instance tersimpan (upsertInstance di
   atas), supaya ketikan yang belum ditekan "Simpan" tidak ikut nyasar ke
   acara yang sudah publik. app/preview/page.tsx (dirender di dalam
   <iframe>, lihat komentar di Builder.tsx soal kenapa harus iframe)
   membaca kunci ini dan re-render tiap ada perubahan lewat event
   `storage` bawaan browser — event itu otomatis terkirim ke window LAIN
   (di sini: iframe-nya) tiap localStorage berubah dari window manapun,
   jadi tidak perlu bikin sistem pesan sendiri. */
const PREVIEW_KEY = "circlesnap-playground:preview-draft";

export interface PreviewDraft {
  templateId: string;
  event: EventConfig;
}

export function writePreviewDraft(draft: PreviewDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREVIEW_KEY, JSON.stringify(draft));
}

export function readPreviewDraft(): PreviewDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREVIEW_KEY);
    return raw ? (JSON.parse(raw) as PreviewDraft) : null;
  } catch {
    return null;
  }
}
