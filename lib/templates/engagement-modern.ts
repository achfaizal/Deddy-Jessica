import type { EventConfig, Template } from "./types";
import { vineLine, diamondMark } from "../compositor";

/**
 * TEMPLATE: Engagement Modern
 *
 * Beda arah dari lamaran.ts (Botanical, floral/klasik) — ini lamaran
 * versi MODERN/MINIMALIS: nyaris tanpa border penuh, ruang kosong luas,
 * motif dua cincin bertumpuk (bukan bunga). Ornamen digambar lewat kode
 * (Template.ornament, sama seperti wedding.ts) — lihat komentar panjang
 * di wedding.ts kenapa jalur ini yang dipakai (tidak ada aset ilustrasi
 * untuk template ini).
 */

const BLUSH = "#F6E4E2";
const INK = "#1B1815"; // = theme.paper (teks nama, hitam pekat)
const MUTED_GOLD = "#B08968"; // = theme.flash
const SMOKE = "#8A7A6E";

const event: EventConfig = {
  code: "ENGAGEMENT",
  names: "Nadia & Bima",
  date: "3 Mei 2027",
  venue: "Rooftop Kalyca",
  hashtag: "#NadiaBima",
  quota: 200,
  brandLabel: "Happy Engagement",
  greeting: "Terima kasih sudah datang di lamaran kami. Ambil foto sepuasnya, lalu titip pesan suara untuk kami.",
  voiceNoteEnabled: true,
  maxVoiceSeconds: 15,
  session: {
    countdownSeconds: 3,
    autoContinue: true,
    mirror: true,
    maxRetakes: 3,
    revealMs: 15000,
    filterCss: "brightness(1.04) contrast(1.05) saturate(0.96)",
    cameraAspect: "1:1",
    guestNameRequired: true,
    moments: { enabled: true },
    share: { instagram: true, whatsapp: true, nativeShare: true, downloadPng: true, downloadJpg: true, downloadVideo: true },
  },
  theme: {
    ink: BLUSH,
    film: "#EFD9D6",
    edge: "#D8B9B2",
    smoke: SMOKE,
    paper: INK,
    flash: MUTED_GOLD,
    live: "#A63B2E",
    brandPurple: "#8A5A4A",
    brandGold: "#D8B9A0",
    fontDisplay: "var(--font-cormorant)",
    canvasFontDisplay: "var(--canvas-font-cormorant)",
    // Senada dengan ringMotif() di ornament() bingkai — dua cincin,
    // paling minimal dari keempat varian.
    decorSvg: "ring",
    videoCard: {
      bg: BLUSH,
      ink: INK,
      smoke: SMOKE,
      waveActive: MUTED_GOLD,
      waveTrack: "#E6D2CC",
      headingGradient: [MUTED_GOLD, MUTED_GOLD, MUTED_GOLD],
    },
    videoTextLayers: [
      { text: "{{brandLabel}}", x: 540, y: 108, size: 42, align: "center", color: MUTED_GOLD, face: "display", weight: 600, label: "Sapaan" },
      { text: "{{names}}", x: 540, y: 178, size: 54, align: "center", color: INK, face: "display", weight: 600, maxWidth: 900, label: "Nama" },
      { text: "{{date}}", x: 540, y: 220, size: 24, align: "center", color: SMOKE, face: "mono", label: "Tanggal" },
    ],
    elements: {
      monogram: { mode: "initials" },
      heroPhoto: { mode: "hidden" },
      kickerFont: "display",
    },
    effects: { petals: { enabled: false, count: 0 }, blobs: true, confetti: false, bokeh: true, sparkle: false },
  },
};

/** Motif dua cincin bertumpuk — pengganti bunga, lebih cocok arah modern
    template ini. Dipakai identik di ketiga bingkai (elemen pemersatu
    "brand" template ini), posisinya yang beda-beda tiap bingkai. Aksen
    kilau kecil di titik tumpang-tindih DITAMBAHKAN (sebelumnya cuma dua
    lingkaran polos) — satu detail kecil, tetap tidak melanggar prinsip
    "ruang kosong luas" template ini (BEDA dari wedding.ts/birthday-gold.ts
    yang sengaja padat, di sini ornamen tetap sedikit tapi masing-masing
    lebih detail). */
function ringMotif(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.strokeStyle = MUTED_GOLD;
  ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.arc(cx - r * 0.32, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + r * 0.32, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  diamondMark(ctx, cx, cy, r * 0.13, MUTED_GOLD);
}

const frames: Template[] = [
  {
    id: "engagement-modern-1",
    name: "Satu Foto Minimal",
    blurb: "Ruang kosong luas, motif dua cincin di atas, sulur tipis di sudut bawah.",
    width: 1080,
    height: 1920,
    printSize: "3.6 × 6.5\"",
    slots: [{ x: 190, y: 420, w: 700, h: 1060 }],
    paper: BLUSH,
    ornament(ctx, w, h) {
      ringMotif(ctx, w / 2, h * 0.115, w * 0.028);
      // TANPA border penuh — sengaja, ini yang bikin kesan "modern
      // minimal" beda dari wedding.ts yang double-border penuh. Sulur
      // tunggal tipis di dua sudut bawah (GANTI tanda radial polos) —
      // satu sentuhan organik, bukan rumpun penuh seperti wedding.ts.
      vineLine(ctx, [[w * 0.05, h - h * 0.03], [w * 0.1, h - h * 0.08], [w * 0.16, h - h * 0.1]], 1, w * 0.014, MUTED_GOLD, w * 0.0016);
      vineLine(ctx, [[w - w * 0.05, h - h * 0.03], [w - w * 0.1, h - h * 0.08], [w - w * 0.16, h - h * 0.1]], 1, w * 0.014, MUTED_GOLD, w * 0.0016);
    },
    textLayers: [
      { text: "ENGAGEMENT", x: 540, y: 220, size: 24, align: "center", color: SMOKE, face: "display", tracking: 7, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 540, y: 300, size: 82, align: "center", color: INK, face: "display", weight: 500, maxWidth: 900, label: "Nama" },
      { text: "{{date}}", x: 540, y: 1730, size: 38, align: "center", color: MUTED_GOLD, face: "display", weight: 500, maxWidth: 900, label: "Tanggal" },
    ],
  },
  {
    id: "engagement-modern-2",
    name: "Tiga Foto Asimetris",
    blurb: "Satu foto besar di atas, dua foto kecil bersisian di bawah — bukan tumpukan rata.",
    width: 800,
    height: 1966,
    printSize: "2.7 × 6.6\"",
    slots: [
      { x: 80, y: 400, w: 640, h: 560 },
      { x: 80, y: 990, w: 300, h: 560 },
      { x: 420, y: 990, w: 300, h: 560 },
    ],
    paper: BLUSH,
    ornament(ctx, w, h) {
      ringMotif(ctx, w / 2, h * 0.11, w * 0.032);
      ctx.strokeStyle = "rgba(176,137,104,0.4)";
      ctx.lineWidth = w * 0.0016;
      ctx.beginPath();
      ctx.moveTo(w * 0.51, 990);
      ctx.lineTo(w * 0.51, 1550);
      ctx.stroke();
    },
    textLayers: [
      { text: "ENGAGEMENT", x: 400, y: 150, size: 18, align: "center", color: SMOKE, face: "display", tracking: 6, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 400, y: 235, size: 50, align: "center", color: INK, face: "display", weight: 500, maxWidth: 700, label: "Nama" },
      { text: "{{date}}", x: 400, y: 1830, size: 32, align: "center", color: MUTED_GOLD, face: "display", weight: 500, maxWidth: 700, label: "Tanggal" },
    ],
  },
  {
    id: "engagement-modern-3",
    name: "Dua Foto Rata Kiri",
    blurb: "Dua foto bertumpuk dengan teks rata kiri (bukan tengah) — aksen asimetris modern.",
    width: 800,
    height: 1966,
    printSize: "2.7 × 6.6\"",
    slots: [
      { x: 90, y: 300, w: 620, h: 760 },
      { x: 90, y: 1090, w: 620, h: 760 },
    ],
    paper: BLUSH,
    ornament(ctx, w, h) {
      ringMotif(ctx, w - w * 0.16, h * 0.075, w * 0.022);
      ctx.strokeStyle = MUTED_GOLD;
      ctx.lineWidth = w * 0.003;
      ctx.beginPath();
      ctx.moveTo(90, 1070);
      ctx.lineTo(710, 1070);
      ctx.stroke();
    },
    textLayers: [
      { text: "ENGAGEMENT", x: 90, y: 155, size: 18, align: "left", color: SMOKE, face: "display", tracking: 5, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 90, y: 220, size: 46, align: "left", color: INK, face: "display", weight: 500, maxWidth: 620, label: "Nama" },
      { text: "{{date}}", x: 90, y: 1900, size: 28, align: "left", color: MUTED_GOLD, face: "display", weight: 500, maxWidth: 620, label: "Tanggal" },
    ],
  },
];

export const engagementModern = {
  id: "engagement-modern",
  label: "Engagement Modern",
  blurb: "Motif dua cincin & ruang kosong luas digambar langsung lewat kode — minimalis, cocok lamaran gaya kontemporer. 3 bingkai.",
  event,
  frames,
};
