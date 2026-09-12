import type { EventConfig, Template } from "./types";
import { tickArc, cornerBracket, diamondMark, beadedRule } from "../compositor";

/**
 * TEMPLATE: Wisuda Modern
 *
 * Beda dari cum-laude.ts (navy-emas klasik, motif sertifikat & laurel
 * melengkung) — ini versi lebih berani/kontemporer: hijau tua pekat,
 * karangan laurel BERSUDUT TAJAM (bukan melengkung), garis tebal. Ornamen
 * digambar lewat kode (Template.ornament) — lihat komentar panjang di
 * wedding.ts kenapa jalur ini yang dipakai.
 */

const GREEN = "#173428";
const GOLD = "#C9A227"; // = theme.flash
const CREAM = "#F1ECDA"; // = theme.paper (teks terang di atas latar gelap)
const SAGE = "#8FA98C"; // = theme.smoke

const event: EventConfig = {
  code: "WISUDA",
  names: "Dewi Ananta",
  date: "9 Oktober 2027",
  venue: "Balairung Universitas",
  hashtag: "#DewiWisuda2027",
  quota: 200,
  brandLabel: "Selamat Wisuda",
  greeting: "Terima kasih sudah merayakan kelulusan ini bersamaku. Ambil foto sepuasnya, lalu titip pesan suara untukku.",
  voiceNoteEnabled: true,
  maxVoiceSeconds: 15,
  session: {
    countdownSeconds: 3,
    autoContinue: true,
    mirror: true,
    maxRetakes: 3,
    revealMs: 15000,
    filterCss: "brightness(1.04) contrast(1.06) saturate(1.02)",
    cameraAspect: "1:1",
    guestNameRequired: true,
    moments: { enabled: true },
    share: { instagram: true, whatsapp: true, nativeShare: true, downloadPng: true, downloadJpg: true, downloadVideo: true },
  },
  theme: {
    ink: GREEN,
    film: "#1F4635",
    edge: "#3C5F4C",
    smoke: SAGE,
    paper: CREAM,
    flash: GOLD,
    live: "#E23D3D",
    brandPurple: "#7A6A1A",
    brandGold: "#E0C25A",
    fontDisplay: "var(--font-cinzel)",
    canvasFontDisplay: "var(--canvas-font-cinzel)",
    // Senada dengan angularLaurel() di ornament() bingkai.
    decorSvg: "laurel",
    videoCard: {
      bg: GREEN,
      ink: CREAM,
      smoke: SAGE,
      waveActive: GOLD,
      waveTrack: "#2E4E3E",
      headingGradient: [GOLD, GOLD, GOLD],
    },
    videoTextLayers: [
      { text: "{{brandLabel}}", x: 540, y: 108, size: 42, align: "center", color: GOLD, face: "display", weight: 600, label: "Sapaan" },
      { text: "{{names}}", x: 540, y: 178, size: 54, align: "center", color: CREAM, face: "display", weight: 600, maxWidth: 900, label: "Nama" },
      { text: "{{date}}", x: 540, y: 220, size: 24, align: "center", color: SAGE, face: "mono", label: "Tanggal" },
    ],
    elements: {
      monogram: { mode: "initials" },
      heroPhoto: { mode: "hidden" },
      kickerFont: "display",
    },
    effects: { petals: { enabled: false, count: 0 }, blobs: false, confetti: false, bokeh: true, sparkle: true },
  },
};

/** Laurel bersudut — cornerBracket (siku tajam) DITAMBAH tickArc busur
    pendek di ujungnya, gabungan dua primitif jadi satu motif "wreath
    modern" — beda dari laurel melengkung lembut wedding.ts. */
function angularLaurel(ctx: CanvasRenderingContext2D, x: number, y: number, dx: 1 | -1, dy: 1 | -1, size: number) {
  cornerBracket(ctx, x, y, size, dx, dy, GOLD, size * 0.045);
  cornerBracket(ctx, x, y, size * 0.72, dx, dy, GOLD, size * 0.025);
  const angleBase = dx === 1 ? (dy === 1 ? 0 : Math.PI * 1.5) : dy === 1 ? Math.PI * 0.5 : Math.PI;
  // Dua lapis tickArc (dalam rapat+pendek, luar jarang+panjang) — sama
  // prinsipnya dengan petalCluster (dua lapis beda ukuran = kesan
  // berlapis), tetap versi BERSUDUT (bukan melengkung) khas template ini.
  tickArc(ctx, x, y, size * 0.55, angleBase, angleBase + Math.PI * 0.5, 6, size * 0.16, GOLD, size * 0.02);
  tickArc(ctx, x, y, size * 0.38, angleBase, angleBase + Math.PI * 0.5, 9, size * 0.09, GOLD, size * 0.014);
  diamondMark(ctx, x + Math.cos(angleBase + Math.PI * 0.25) * size * 0.7, y + Math.sin(angleBase + Math.PI * 0.25) * size * 0.7, size * 0.045, GOLD);
}

const frames: Template[] = [
  {
    id: "wisuda-modern-1",
    name: "Satu Foto Laurel Tajam",
    blurb: "Laurel bersudut tajam di dua sudut bawah, garis rangkap di atas nama.",
    width: 1080,
    height: 1920,
    printSize: "3.6 × 6.5\"",
    slots: [{ x: 165, y: 360, w: 750, h: 1120 }],
    paper: GREEN,
    ornament(ctx, w, h) {
      const m = w * 0.035;
      beadedRule(ctx, m, m, w - m, m, w * 0.02, w * 0.0016, GOLD);
      beadedRule(ctx, m, h - m, w - m, h - m, w * 0.02, w * 0.0016, GOLD);
      beadedRule(ctx, m, m, m, h - m, w * 0.02, w * 0.0016, GOLD);
      beadedRule(ctx, w - m, m, w - m, h - m, w * 0.02, w * 0.0016, GOLD);

      angularLaurel(ctx, w * 0.07, h - h * 0.05, 1, -1, w * 0.11);
      angularLaurel(ctx, w - w * 0.07, h - h * 0.05, -1, -1, w * 0.11);

      ctx.strokeStyle = GOLD;
      ctx.lineWidth = w * 0.0022;
      ctx.beginPath();
      ctx.moveTo(w * 0.28, 200);
      ctx.lineTo(w * 0.72, 200);
      ctx.stroke();
      ctx.lineWidth = w * 0.001;
      ctx.beginPath();
      ctx.moveTo(w * 0.32, 216);
      ctx.lineTo(w * 0.68, 216);
      ctx.stroke();
    },
    textLayers: [
      { text: "WISUDA", x: 540, y: 170, size: 26, align: "center", color: SAGE, face: "display", tracking: 7, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 540, y: 258, size: 86, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 940, label: "Nama" },
      { text: "{{date}}", x: 540, y: 1660, size: 40, align: "center", color: CREAM, face: "display", weight: 500, maxWidth: 900, label: "Tanggal" },
    ],
  },
  {
    id: "wisuda-modern-2",
    name: "Tiga Foto Sejajar",
    blurb: "Tiga jepretan berjajar HORIZONTAL (bukan bertumpuk) — beda dari kebanyakan bingkai lain.",
    width: 1080,
    height: 1920,
    printSize: "3.6 × 6.5\"",
    slots: [
      { x: 60, y: 560, w: 300, h: 460 },
      { x: 390, y: 560, w: 300, h: 460 },
      { x: 720, y: 560, w: 300, h: 460 },
    ],
    paper: GREEN,
    ornament(ctx, w, h) {
      const m = w * 0.035;
      beadedRule(ctx, m, m, w - m, m, w * 0.02, w * 0.0016, GOLD);
      beadedRule(ctx, m, h - m, w - m, h - m, w * 0.02, w * 0.0016, GOLD);
      beadedRule(ctx, m, m, m, h - m, w * 0.02, w * 0.0016, GOLD);
      beadedRule(ctx, w - m, m, w - m, h - m, w * 0.02, w * 0.0016, GOLD);

      angularLaurel(ctx, w * 0.06, h * 0.06, 1, 1, w * 0.09);
      angularLaurel(ctx, w - w * 0.06, h * 0.06, -1, 1, w * 0.09);
      diamondMark(ctx, w / 2, h * 0.088, w * 0.007, GOLD);
    },
    textLayers: [
      { text: "WISUDA", x: 540, y: 200, size: 22, align: "center", color: SAGE, face: "display", tracking: 6, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 540, y: 300, size: 62, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 940, label: "Nama" },
      { text: "{{date}}", x: 540, y: 1660, size: 36, align: "center", color: CREAM, face: "display", weight: 500, maxWidth: 900, label: "Tanggal" },
    ],
  },
  {
    id: "wisuda-modern-3",
    name: "Dua Foto Palang Tebal",
    blurb: "Dua foto dipisah palang emas tebal (bukan garis tipis) — kesan lebih tegas.",
    width: 800,
    height: 1966,
    printSize: "2.7 × 6.6\"",
    slots: [
      { x: 70, y: 280, w: 660, h: 760 },
      { x: 70, y: 1130, w: 660, h: 680 },
    ],
    paper: GREEN,
    ornament(ctx, w, h) {
      const m = w * 0.035;
      beadedRule(ctx, m, m, w - m, m, w * 0.02, w * 0.0016, GOLD);
      beadedRule(ctx, m, h - m, w - m, h - m, w * 0.02, w * 0.0016, GOLD);
      beadedRule(ctx, m, m, m, h - m, w * 0.02, w * 0.0016, GOLD);
      beadedRule(ctx, w - m, m, w - m, h - m, w * 0.02, w * 0.0016, GOLD);

      ctx.fillStyle = GOLD;
      ctx.fillRect(0, 1045, w, 40);
      angularLaurel(ctx, w * 0.08, h - h * 0.03, 1, -1, w * 0.1);
      angularLaurel(ctx, w - w * 0.08, h - h * 0.03, -1, -1, w * 0.1);
    },
    textLayers: [
      { text: "WISUDA", x: 400, y: 145, size: 18, align: "center", color: SAGE, face: "display", tracking: 5, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 400, y: 215, size: 46, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 700, label: "Nama" },
      { text: "{{date}}", x: 400, y: 1895, size: 26, align: "center", color: CREAM, face: "display", weight: 500, maxWidth: 700, label: "Tanggal" },
    ],
  },
];

export const wisudaModern = {
  id: "wisuda-modern",
  label: "Wisuda Modern",
  blurb: "Laurel bersudut tajam & palang emas tebal digambar langsung lewat kode — kelulusan gaya berani/kontemporer. 3 bingkai.",
  event,
  frames,
};
