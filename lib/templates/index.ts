import type { EventConfig, Template } from "./types";
import { lamaran } from "./lamaran";
import { nightFest } from "./night-fest";
import { confettiPop } from "./confetti-pop";
import { cumLaude } from "./cum-laude";
import { summit } from "./summit";
import { weddingOrnate } from "./wedding-ornate";
import { engagementModern } from "./engagement-modern";
import { birthdayGold } from "./birthday-gold";
import { wisudaModern } from "./wisuda-modern";
import { wedding } from "./wedding";

export * from "./types";

export interface PlaygroundTemplate {
  /** Dipakai di URL (/t/<id>) dan sebagai nama folder public/templates/<id>/. */
  id: string;
  /** Nama template di kartu katalog (root "/") — BEDA dari event.names
      (nama acara/pasangan yang dilihat tamu di dalam sesi). "Lamaran"
      vs "Salma & Faizal": satu label produk, satu isi contoh. */
  label: string;
  /** Satu-dua kalimat di kartu katalog, jelaskan gaya & jumlah bingkai. */
  blurb: string;
  event: EventConfig;
  frames: Template[];
}

/**
 * KATALOG TEMPLATE
 *
 * Satu playground, banyak template — ini titik satu-satunya yang perlu
 * disentuh untuk menambah/mencabut template dari situs. Urutan array =
 * urutan tampil di halaman katalog (root "/", lihat app/page.tsx).
 */
export const PLAYGROUND_TEMPLATES: PlaygroundTemplate[] = [
  lamaran,
  confettiPop,
  cumLaude,
  nightFest,
  summit,
  weddingOrnate,
  engagementModern,
  birthdayGold,
  wisudaModern,
];

/** Template KHUSUS CLIENT — clone template katalog, dikustomisasi
    langsung di kode (bukan lewat Builder/localStorage) untuk satu client
    sungguhan. SENGAJA TIDAK masuk PLAYGROUND_TEMPLATES di atas, jadi
    tidak nongol di katalog "Pilih Template" publik maupun root "/" —
    cuma bisa diakses kalau tahu URL-nya langsung (/t/<id>,
    /builder/<id>), lihat komentar di lib/templates/wedding.ts. */
const CLIENT_TEMPLATES: PlaygroundTemplate[] = [wedding];

export function getTemplate(id: string): PlaygroundTemplate | undefined {
  return [...PLAYGROUND_TEMPLATES, ...CLIENT_TEMPLATES].find(
    (t) => t.id.toLowerCase() === id.toLowerCase()
  );
}

/** ID "bingkai" semu buat kartu video pesan suara (EventTheme.videoTextLayers)
    — dipakai Builder (components/dashboard/Builder.tsx) supaya kartu video
    muncul sebagai item ke-4 di daftar Bingkai, bisa diedit teksnya dengan
    cara SAMA PERSIS (drag/ketik/font/dst, FrameTextEditor apa adanya) —
    override-nya numpang di EventConfig.frameTextLayers dengan kunci ini,
    BUKAN mekanisme override terpisah. Awalan dobel-underscore sengaja
    supaya mustahil tabrakan sama Template.id template asli mana pun
    (semua id template katalog id kata biasa, mis. "lamaran-1"). */
export const VIDEO_CARD_FRAME_ID = "__video_card__";

export function tokensFor(ev: EventConfig): Record<string, string> {
  return {
    names: ev.names,
    date: ev.date,
    venue: ev.venue,
    hashtag: ev.hashtag,
    code: ev.code,
  };
}

/* ----------------------------------------------------------- kuota lokal
   Playground ini tidak punya server yang bisa jadi wasit — kuota "berapa
   strip sudah terpakai" cuma disimpan di localStorage PERANGKAT TAMU ini.
   Itu artinya kuota tidak benar-benar membatasi apa pun lintas perangkat
   (dua HP tamu sama-sama mulai dari 0) — cukup untuk memperagakan
   perilaku "paket habis", tidak untuk menegakkannya sungguhan. Penegakan
   nyata butuh backend (lihat CLAUDE.md § kalau/ketika playground ini
   dibawa jadi produk). */
const usedKey = (code: string) => `circlesnap-playground:used:${code}`;

export function readUsed(code: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(usedKey(code));
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function bumpUsed(code: string): number {
  const next = readUsed(code) + 1;
  window.localStorage.setItem(usedKey(code), String(next));
  return next;
}

/** Nomor strip untuk struk — prefix pendek (3 huruf) dari kode event,
    bukan slug penuh, supaya nama file unduhan tidak kepanjangan. */
export function receiptNo(code: string, used: number): string {
  const prefix = code.replace(/[^A-Z0-9]/gi, "").slice(0, 3).toUpperCase();
  return `${prefix}-${String(used).padStart(4, "0")}`;
}
