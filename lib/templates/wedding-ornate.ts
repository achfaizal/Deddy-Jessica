import type { EventConfig, Template } from "./types";
import { petalCluster, vineLine, beadedRule, diamondMark, cornerBracket } from "../compositor";

/**
 * TEMPLATE: Wedding Ornate
 *
 * Id ini SEBELUMNYA "wedding" polos — diganti "wedding-ornate" supaya
 * tidak tabrakan dengan lib/templates/wedding.ts yang baru (clone
 * Botanical buat client sungguhan, lihat komentar di file itu).
 *
 * Beda dari lamaran.ts (Botanical) — bingkainya TIDAK punya PNG ilustrasi
 * sama sekali. Ornamen (garis berlapis, buket kelopak, sulur, siku
 * sudut) digambar LANGSUNG lewat kode canvas (`Template.ornament`, lihat
 * types.ts) pakai primitif dari lib/compositor.ts (petalCluster/vineLine/
 * beadedRule/diamondMark/cornerBracket) — dipilih begini karena tidak ada
 * aset ilustrasi tangan
 * tersedia untuk template ini (beda dari Botanical yang PNG-nya memang
 * digambar desainer). Sama-sama TIDAK ada satu pun nama/tanggal dibakar
 * ke ornamen — semua tetap lewat textLayers seperti template lain.
 *
 * heroPhoto & decorUrl SENGAJA tidak diisi (keduanya butuh file gambar,
 * template ini tidak punya satu pun) — layar Selamat Datang pakai
 * monogram inisial teks + efek ambient CSS (petals/bokeh/sparkle, sudah
 * ada di WelcomeScreen.tsx) + decorSvg "floral" (dekorasi sudut versi
 * kode, components/CornerOrnament.tsx, dipasang EventBooth.tsx — jalan
 * di SELURUH sesi tamu, bukan cuma layar sambutan) — semua tanpa aset.
 */

const IVORY = "#FBF6EF";
const GOLD = "#9C7A45"; // = theme.flash
const DEEP = "#2B2118"; // = theme.paper (teks nama, paling gelap)
const SMOKE = "#6E5B44"; // = theme.smoke (teks label)

const event: EventConfig = {
  code: "WEDDING",
  names: "Alya & Raka",
  date: "14 Februari 2027",
  venue: "Hotel Mulia, Jakarta",
  hashtag: "#AlyaRaka",
  quota: 200,
  brandLabel: "Happy Wedding",
  greeting:
    "Terima kasih sudah hadir di pernikahan kami. Ambil foto sepuasnya, lalu titip pesan suara untuk kami.",
  voiceNoteEnabled: true,
  maxVoiceSeconds: 15,
  session: {
    countdownSeconds: 3,
    autoContinue: true,
    mirror: true,
    maxRetakes: 3,
    revealMs: 15000,
    filterCss: "brightness(1.05) contrast(1.03) saturate(1.05)",
    cameraAspect: "1:1",
    guestNameRequired: true,
    moments: { enabled: true },
    share: { instagram: true, whatsapp: true, nativeShare: true, downloadPng: true, downloadJpg: true, downloadVideo: true },
  },
  theme: {
    ink: IVORY,
    film: "#F1E9DC",
    edge: "#D8C6A0",
    smoke: SMOKE,
    paper: DEEP,
    flash: GOLD,
    live: "#A63B2E",
    brandPurple: "#7A5E28",
    brandGold: "#D8C08A",
    fontDisplay: "var(--font-playfair)",
    canvasFontDisplay: "var(--canvas-font-playfair)",
    // Senada dengan buket kelopak di ornament() bingkai (lihat frames di
    // bawah) — dekorasi sudut sepanjang sesi tamu, bukan cuma bingkai
    // fotonya, ikut motif floral juga.
    decorSvg: "floral",
    // Tanpa videoBg (tidak ada aset gambar) — kartu video pakai latar
    // putih bawaan lib/video.ts, cuma warnanya ditema-in di sini supaya
    // tetap senada (bukan gradasi ungu-pink-emas generik).
    videoCard: {
      bg: IVORY,
      ink: DEEP,
      smoke: SMOKE,
      waveActive: GOLD,
      waveTrack: "#E3D9C5",
      headingGradient: [GOLD, GOLD, GOLD],
    },
    videoTextLayers: [
      { text: "{{brandLabel}}", x: 540, y: 108, size: 46, align: "center", color: GOLD, face: "display", weight: 600, label: "Sapaan" },
      { text: "{{names}}", x: 540, y: 178, size: 56, align: "center", color: DEEP, face: "display", weight: 600, maxWidth: 900, label: "Nama" },
      { text: "{{date}}", x: 540, y: 220, size: 26, align: "center", color: SMOKE, face: "mono", label: "Tanggal" },
    ],
    elements: {
      monogram: { mode: "initials" },
      heroPhoto: { mode: "hidden" },
      kickerFont: "display",
    },
    effects: { petals: { enabled: true, count: 6 }, blobs: false, confetti: false, bokeh: true, sparkle: true },
  },
};

const frames: Template[] = [
  {
    id: "wedding-ornate-1",
    name: "Satu Foto Ivory",
    blurb: "Garis emas berlapis dengan karangan bunga geometris di dua sudut bawah.",
    width: 1080,
    height: 1920,
    printSize: "3.6 × 6.5\"",
    // Tidak ada PNG — slot dirancang manual (bukan dideteksi dari alpha
    // channel, karena tidak ada gambar sama sekali untuk template ini).
    slots: [{ x: 165, y: 340, w: 750, h: 1140 }],
    paper: IVORY,
    ornament(ctx, w, h) {
      const m = w * 0.045;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = w * 0.0022;
      ctx.strokeRect(m, m, w - m * 2, h - m * 2);
      const m2 = m + w * 0.016;
      ctx.lineWidth = w * 0.0011;
      ctx.strokeRect(m2, m2, w - m2 * 2, h - m2 * 2);
      // Garis manik tipis di ANTARA dua border — lapisan ketiga, bikin
      // bingkainya terasa lebih detail/bertekstur (bukan cuma dua garis
      // polos seperti sebelumnya).
      const m3 = (m + m2) / 2;
      beadedRule(ctx, m3, m3, w - m3, m3, w * 0.018, w * 0.0018, GOLD);
      beadedRule(ctx, m3, h - m3, w - m3, h - m3, w * 0.018, w * 0.0018, GOLD);

      // Buket kelopak di KEEMPAT sudut (sebelumnya cuma 2 sudut bawah,
      // berupa garis tipis) — besar di bawah, kecil di atas biar
      // seimbang, bukan berat sebelah.
      petalCluster(ctx, m2 + w * 0.02, h - m2 - w * 0.02, w * 0.11, 9, GOLD);
      petalCluster(ctx, w - m2 - w * 0.02, h - m2 - w * 0.02, w * 0.11, 9, GOLD);
      petalCluster(ctx, m2 + w * 0.015, m2 + w * 0.015, w * 0.06, 7, GOLD);
      petalCluster(ctx, w - m2 - w * 0.015, m2 + w * 0.015, w * 0.06, 7, GOLD);

      // Sulur tipis menghubungkan dua buket atas — mengisi ruang kosong
      // sepanjang tepi atas, bukan dibiarkan polos.
      vineLine(
        ctx,
        [
          [m2 + w * 0.06, m2 + w * 0.03],
          [w * 0.35, m2 + w * 0.06],
          [w * 0.5, m2 + w * 0.02],
          [w * 0.65, m2 + w * 0.06],
          [w - m2 - w * 0.06, m2 + w * 0.03],
        ],
        1,
        w * 0.018,
        GOLD,
        w * 0.0012
      );
      diamondMark(ctx, w / 2, m2 + w * 0.02, w * 0.007, GOLD);
    },
    textLayers: [
      { text: "WEDDING", x: 540, y: 170, size: 26, align: "center", color: SMOKE, face: "display", tracking: 6, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 540, y: 258, size: 92, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 940, label: "Nama" },
      { text: "{{date}}", x: 540, y: 1660, size: 44, align: "center", color: DEEP, face: "display", weight: 600, maxWidth: 900, label: "Tanggal" },
    ],
  },
  {
    id: "wedding-ornate-2",
    name: "Tiga Foto Berjajar",
    blurb: "Tiga jepretan bertumpuk dengan tanda radial emas di sudut atas.",
    width: 800,
    height: 1966,
    printSize: "2.7 × 6.6\"",
    slots: [
      { x: 100, y: 330, w: 600, h: 420 },
      { x: 100, y: 800, w: 600, h: 420 },
      { x: 100, y: 1270, w: 600, h: 420 },
    ],
    paper: IVORY,
    ornament(ctx, w, h) {
      const m = w * 0.05;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = w * 0.003;
      ctx.strokeRect(m, m, w - m * 2, h - m * 2);

      // Buket di KEEMPAT sudut (sebelumnya cuma 2 sudut atas berupa
      // garis tipis) — atas lebih besar (dekat judul), bawah lebih kecil.
      petalCluster(ctx, m + w * 0.02, m + w * 0.02, w * 0.13, 9, GOLD);
      petalCluster(ctx, w - m - w * 0.02, m + w * 0.02, w * 0.13, 9, GOLD);
      petalCluster(ctx, m + w * 0.015, h - m - w * 0.015, w * 0.07, 7, GOLD);
      petalCluster(ctx, w - m - w * 0.015, h - m - w * 0.015, w * 0.07, 7, GOLD);

      // Garis manik pemisah antar tiga foto — GANTI garis polos
      // sebelumnya, lebih detail/bertekstur sekaligus tetap tipis
      // (tidak mengalihkan perhatian dari fotonya).
      [770, 1240].forEach((y) => {
        beadedRule(ctx, m + w * 0.03, y, w - m - w * 0.03, y, w * 0.02, w * 0.0016, GOLD);
      });
    },
    textLayers: [
      { text: "WEDDING", x: 400, y: 130, size: 20, align: "center", color: SMOKE, face: "display", tracking: 5, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 400, y: 220, size: 58, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 700, label: "Nama" },
      { text: "{{date}}", x: 400, y: 1850, size: 36, align: "center", color: DEEP, face: "display", weight: 600, maxWidth: 700, label: "Tanggal" },
    ],
  },
  {
    id: "wedding-ornate-3",
    name: "Dua Foto Berdampingan",
    blurb: "Dua jepretan besar bersisian dengan siku sudut modern di keempat pojok.",
    width: 800,
    height: 1966,
    printSize: "2.7 × 6.6\"",
    // Beda tata letak dari wedding-ornate-2 (bertumpuk) — dua foto BERSISIAN,
    // supaya ketiga bingkai template ini benar-benar tidak seragam.
    slots: [
      { x: 60, y: 280, w: 340, h: 1200 },
      { x: 400, y: 280, w: 340, h: 1200 },
    ],
    paper: IVORY,
    ornament(ctx, w, h) {
      const s = w * 0.09;
      const lw = w * 0.0026;
      cornerBracket(ctx, w * 0.05, h * 0.03, s, 1, 1, GOLD, lw);
      cornerBracket(ctx, w - w * 0.05, h * 0.03, s, -1, 1, GOLD, lw);
      cornerBracket(ctx, w * 0.05, h - h * 0.03, s, 1, -1, GOLD, lw);
      cornerBracket(ctx, w - w * 0.05, h - h * 0.03, s, -1, -1, GOLD, lw);

      // Buket kecil di dua sudut atas (dalam siku) — kombinasi "modern"
      // (siku) + "romantis" (bunga), beda karakter dari wedding-ornate-1/2 yang
      // buketnya besar & dominan.
      petalCluster(ctx, w * 0.05 + s * 0.55, h * 0.03 + s * 0.55, w * 0.045, 6, GOLD);
      petalCluster(ctx, w - w * 0.05 - s * 0.55, h * 0.03 + s * 0.55, w * 0.045, 6, GOLD);

      // Sulur di tengah (GANTI garis lurus polos) — pembatas dua foto
      // bersisian, sekarang melengkung halus dengan daun kecil.
      vineLine(
        ctx,
        [
          [w / 2, 260],
          [w / 2 - w * 0.025, h * 0.42],
          [w / 2 + w * 0.025, h * 0.62],
          [w / 2, h - 480],
        ],
        1,
        w * 0.016,
        GOLD,
        w * 0.0016
      );
      diamondMark(ctx, w / 2, 240, w * 0.008, GOLD);
      diamondMark(ctx, w / 2, h - 500, w * 0.008, GOLD);
    },
    textLayers: [
      { text: "WEDDING", x: 400, y: 140, size: 20, align: "center", color: SMOKE, face: "display", tracking: 5, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 400, y: 205, size: 50, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 700, label: "Nama" },
      { text: "{{date}}", x: 400, y: 1830, size: 34, align: "center", color: DEEP, face: "display", weight: 600, maxWidth: 700, label: "Tanggal" },
    ],
  },
];

export const weddingOrnate = {
  id: "wedding-ornate",
  label: "Wedding Ornate",
  blurb: "Garis emas berlapis & karangan bunga geometris digambar langsung lewat kode — cocok untuk pernikahan formal. 3 bingkai.",
  event,
  frames,
};
