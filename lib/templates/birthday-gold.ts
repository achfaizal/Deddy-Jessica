import type { EventConfig, Template } from "./types";
import { tickArc, diamondMark, beadedRule, petalCluster } from "../compositor";

/**
 * TEMPLATE: Birthday Gold
 *
 * Beda dari confetti-pop.ts (ceria/playful, balon & pelangi) — ini versi
 * "mewah" ulang tahun: latar gelap, ledakan sinar emas, confetti
 * berbentuk belah ketupat geometris (bukan bulatan kartun). Ornamen
 * digambar lewat kode (Template.ornament) — lihat komentar panjang di
 * wedding.ts kenapa jalur ini yang dipakai.
 */

const BLACK = "#161616";
const GOLD = "#D4AF37"; // = theme.flash
const CREAM = "#F5EFE0"; // = theme.paper (teks terang di atas latar gelap)
const SMOKE = "#B8A98C";

const event: EventConfig = {
  code: "BIRTHDAY",
  names: "Kirana",
  date: "21 Juni 2027",
  venue: "The Grand Ballroom",
  hashtag: "#KiranaTurns25",
  quota: 200,
  brandLabel: "Happy Birthday",
  greeting: "Terima kasih sudah datang merayakan hari ini bersamaku. Ambil foto sepuasnya, lalu titip pesan suara untukku.",
  voiceNoteEnabled: true,
  maxVoiceSeconds: 15,
  session: {
    countdownSeconds: 3,
    autoContinue: true,
    mirror: true,
    maxRetakes: 3,
    revealMs: 15000,
    filterCss: "brightness(1.06) contrast(1.08) saturate(1.1)",
    cameraAspect: "1:1",
    guestNameRequired: true,
    moments: { enabled: true },
    share: { instagram: true, whatsapp: true, nativeShare: true, downloadPng: true, downloadJpg: true, downloadVideo: true },
  },
  theme: {
    ink: BLACK,
    film: "#221D14",
    edge: "#4A3F26",
    smoke: SMOKE,
    paper: CREAM,
    flash: GOLD,
    live: "#E23D3D",
    brandPurple: "#8A6D1A",
    brandGold: "#E8C866",
    fontDisplay: "var(--font-cinzel)",
    canvasFontDisplay: "var(--canvas-font-cinzel)",
    // Senada dengan ledakan sinar tickArc() di ornament() bingkai.
    decorSvg: "sunburst",
    videoCard: {
      bg: BLACK,
      ink: CREAM,
      smoke: SMOKE,
      waveActive: GOLD,
      waveTrack: "#3A331F",
      headingGradient: [GOLD, GOLD, GOLD],
    },
    videoTextLayers: [
      { text: "{{brandLabel}}", x: 540, y: 108, size: 44, align: "center", color: GOLD, face: "display", weight: 600, label: "Sapaan" },
      { text: "{{names}}", x: 540, y: 178, size: 56, align: "center", color: CREAM, face: "display", weight: 600, maxWidth: 900, label: "Nama" },
      { text: "{{date}}", x: 540, y: 220, size: 26, align: "center", color: SMOKE, face: "mono", label: "Tanggal" },
    ],
    elements: {
      monogram: { mode: "initials" },
      heroPhoto: { mode: "hidden" },
      kickerFont: "display",
    },
    effects: { petals: { enabled: false, count: 0 }, blobs: false, confetti: true, bokeh: true, sparkle: true },
  },
};

/** Confetti belah ketupat — dipakai bareng di ketiga bingkai (pola titik
    beda tiap bingkai), pengganti confetti bulat kartun supaya kesannya
    lebih mewah/geometris. */
function confettiDiamonds(ctx: CanvasRenderingContext2D, points: [number, number, number][]) {
  points.forEach(([x, y, size]) => diamondMark(ctx, x, y, size, GOLD));
}

const frames: Template[] = [
  {
    id: "birthday-gold-1",
    name: "Satu Foto Sunburst",
    blurb: "Ledakan sinar emas di atas nama, confetti belah ketupat menyebar di tepi.",
    width: 1080,
    height: 1920,
    printSize: "3.6 × 6.5\"",
    slots: [{ x: 165, y: 400, w: 750, h: 1120 }],
    paper: BLACK,
    ornament(ctx, w, h) {
      // Ledakan sinar — busur lebar, tanda panjang & jarang (beda dari
      // karangan bunga wedding.ts yang tanda rapat & pendek).
      tickArc(ctx, w / 2, h * 0.16, w * 0.05, Math.PI * 1.15, Math.PI * 1.85, 14, w * 0.05, GOLD, w * 0.0026);

      const m = w * 0.04;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = w * 0.0018;
      ctx.strokeRect(m, m, w - m * 2, h - m * 2);
      // Garis manik di dalam border — lapisan kedua, bikin bingkainya
      // tidak cuma satu garis polos.
      const m2 = m + w * 0.014;
      beadedRule(ctx, m2, m2, w - m2, m2, w * 0.02, w * 0.0016, GOLD);
      beadedRule(ctx, m2, h - m2, w - m2, h - m2, w * 0.02, w * 0.0016, GOLD);

      // Rumpun kelopak kecil (kesan "kembang api emas") di dua sudut
      // bawah — sebelumnya sudut ini cuma diisi confetti titik, sekarang
      // ada elemen fokus juga, bukan cuma taburan.
      petalCluster(ctx, m2 + w * 0.02, h - m2 - w * 0.02, w * 0.065, 10, GOLD);
      petalCluster(ctx, w - m2 - w * 0.02, h - m2 - w * 0.02, w * 0.065, 10, GOLD);

      confettiDiamonds(ctx, [
        [w * 0.1, h * 0.08, w * 0.008],
        [w * 0.9, h * 0.09, w * 0.006],
        [w * 0.08, h * 0.42, w * 0.007],
        [w * 0.92, h * 0.5, w * 0.007],
        [w * 0.09, h * 0.62, w * 0.005],
        [w * 0.91, h * 0.68, w * 0.006],
        [w * 0.14, h * 0.75, w * 0.006],
        [w * 0.86, h * 0.79, w * 0.005],
      ]);
    },
    textLayers: [
      { text: "HAPPY BIRTHDAY", x: 540, y: 240, size: 28, align: "center", color: SMOKE, face: "display", tracking: 6, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 540, y: 320, size: 94, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 940, label: "Nama" },
      { text: "{{date}}", x: 540, y: 1660, size: 40, align: "center", color: CREAM, face: "display", weight: 500, maxWidth: 900, label: "Tanggal" },
    ],
  },
  {
    id: "birthday-gold-2",
    name: "Tiga Foto Kaskade",
    blurb: "Tiga foto bertangga diagonal — bukan tumpukan rata, kesannya lebih dinamis.",
    width: 800,
    height: 1966,
    printSize: "2.7 × 6.6\"",
    slots: [
      { x: 80, y: 350, w: 460, h: 380 },
      { x: 280, y: 780, w: 460, h: 380 },
      { x: 80, y: 1210, w: 460, h: 380 },
    ],
    paper: BLACK,
    ornament(ctx, w, h) {
      tickArc(ctx, w / 2, h * 0.1, w * 0.06, Math.PI * 1.2, Math.PI * 1.8, 10, w * 0.04, GOLD, w * 0.0026);
      petalCluster(ctx, w * 0.07, h * 0.05, w * 0.05, 8, GOLD);
      petalCluster(ctx, w - w * 0.07, h * 0.05, w * 0.05, 8, GOLD);
      confettiDiamonds(ctx, [
        [w * 0.08, h * 0.28, w * 0.007],
        [w * 0.94, h * 0.35, w * 0.006],
        [w * 0.06, h * 0.5, w * 0.005],
        [w * 0.94, h * 0.58, w * 0.006],
        [w * 0.06, h * 0.62, w * 0.006],
        [w * 0.94, h * 0.75, w * 0.007],
        [w * 0.1, h * 0.85, w * 0.005],
        [w * 0.9, h * 0.92, w * 0.006],
        [w * 0.1, h * 0.92, w * 0.007],
      ]);
    },
    textLayers: [
      { text: "HAPPY BIRTHDAY", x: 400, y: 150, size: 20, align: "center", color: SMOKE, face: "display", tracking: 5, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 400, y: 230, size: 56, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 700, label: "Nama" },
      { text: "{{date}}", x: 400, y: 1850, size: 32, align: "center", color: CREAM, face: "display", weight: 500, maxWidth: 700, label: "Tanggal" },
    ],
  },
  {
    id: "birthday-gold-3",
    name: "Dua Foto Bertingkat",
    blurb: "Satu foto besar di atas, satu foto sedang di bawah — proporsi tidak sama.",
    width: 800,
    height: 1966,
    printSize: "2.7 × 6.6\"",
    slots: [
      { x: 70, y: 300, w: 660, h: 900 },
      { x: 70, y: 1230, w: 660, h: 560 },
    ],
    paper: BLACK,
    ornament(ctx, w, h) {
      tickArc(ctx, w / 2, h * 0.09, w * 0.055, Math.PI * 1.15, Math.PI * 1.85, 11, w * 0.038, GOLD, w * 0.0024);
      beadedRule(ctx, 70, 1215, 730, 1215, w * 0.022, w * 0.0018, GOLD);
      petalCluster(ctx, w * 0.07, h * 0.94, w * 0.045, 7, GOLD);
      petalCluster(ctx, w - w * 0.07, h * 0.94, w * 0.045, 7, GOLD);
      confettiDiamonds(ctx, [
        [w * 0.09, h * 0.35, w * 0.006],
        [w * 0.91, h * 0.4, w * 0.006],
        [w * 0.5, h * 0.965, w * 0.006],
      ]);
    },
    textLayers: [
      { text: "HAPPY BIRTHDAY", x: 400, y: 140, size: 18, align: "center", color: SMOKE, face: "display", tracking: 5, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 400, y: 205, size: 48, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 700, label: "Nama" },
      { text: "{{date}}", x: 400, y: 1900, size: 28, align: "center", color: CREAM, face: "display", weight: 500, maxWidth: 700, label: "Tanggal" },
    ],
  },
];

export const birthdayGold = {
  id: "birthday-gold",
  label: "Birthday Gold",
  blurb: "Ledakan sinar emas & confetti belah ketupat digambar langsung lewat kode — ulang tahun premium, bukan playful. 3 bingkai.",
  event,
  frames,
};
