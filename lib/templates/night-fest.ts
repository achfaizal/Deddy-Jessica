import type { EventConfig, Template } from "./types";

/**
 * TEMPLATE: Night Fest
 *
 * Tema synthwave 80s untuk acara musik/festival — beda arah sepenuhnya
 * dari Lamaran (pernikahan/klasik), untuk membuktikan struktur satu
 * template = satu berkas ini benar-benar netral terhadap gaya. PNG
 * bingkai ada di public/templates/night-fest/.
 *
 * `names` di sini dipakai sebagai nama ACARA (bukan nama pasangan) —
 * field yang sama, makna yang menyesuaikan konteks template. Klien nanti
 * cukup ganti field ini + date/venue/hashtag lewat editor teks, bingkai
 * dan warnanya tetap sama persis.
 */

const event: EventConfig = {
  code: "NIGHTFEST",
  names: "NIGHT FEST",
  date: "20 Desember 2026",
  venue: "GBK Senayan, Jakarta",
  hashtag: "#NightFest2026",
  quota: 300,
  brandLabel: "Live Music Festival",
  greeting:
    "Selamat datang di Night Fest! Ambil foto sepuasnya di photobooth retro kami, lalu titip pesan suara buat sesama penonton.",
  voiceNoteEnabled: true,
  maxVoiceSeconds: 15,
  session: {
    countdownSeconds: 3,
    autoContinue: true,
    mirror: true,
    maxRetakes: 3,
    revealMs: 15000,
    // Lebih kontras & jenuh dari Lamaran — cocok untuk lampu panggung,
    // beda nuansa dari filter lembut acara pernikahan.
    filterCss: "brightness(1.05) contrast(1.15) saturate(1.3)",
    cameraAspect: "1:1",
    guestNameRequired: true,
    // Galeri "Momen" diunggah ke server (Vercel Blob di production / folder
    // lokal saat dev, lihat lib/moments.ts) — bersama lintas HP.
    moments: { enabled: true },
    share: {
      instagram: true,
      whatsapp: true,
      nativeShare: true,
      downloadPng: true,
      downloadJpg: true,
      downloadVideo: true,
    },
  },
  // Tema GELAP: `ink` ungu-navy nyaris hitam (latar halaman), `paper`
  // lavender nyaris putih (teks utama). flash = magenta neon, brandGold
  // dipakai ulang sebagai cyan neon — gradasi tombol jadi ungu → cyan,
  // senada dengan matahari synthwave di bingkai.
  theme: {
    ink: "#150826",
    film: "#2D0F45",
    edge: "#4A2A72",
    smoke: "#B8A8D9",
    paper: "#F3EFFF",
    flash: "#FF2D95",
    live: "#FF4D4D",
    brandPurple: "#7C3AED",
    brandGold: "#00E5FF",
    fontDisplay: "var(--font-montserrat)",
    canvasFontDisplay: "var(--canvas-font-montserrat)",
    decorUrl: "/templates/night-fest/decor-tl.png",
    videoBg: "/templates/night-fest/bg-video.png",
    effects: {
      // Kelopak bunga tidak cocok untuk festival musik — dimatikan, beda
      // dari Lamaran yang menyalakannya.
      petals: { enabled: false, count: 0 },
      blobs: true,
      confetti: true,
      bokeh: true,
      sparkle: true,
    },
    elements: {
      // Monogram inisial ("N") terasa janggal untuk nama acara satu kata
      // (beda dari "S · F" yang natural untuk nama pasangan) — poster
      // festival biasanya langsung ke judul besar, jadi disembunyikan.
      monogram: { mode: "hidden" },
      buttonShape: "rounded",
      buttonStyle: "gradient",
      cardRadius: 16,
    },
  },
};

const frames: Template[] = [
  {
    id: "night-fest-1",
    name: "Satu Foto Neon",
    blurb: "Satu foto besar dengan bingkai neon cyan dan horizon synthwave di bawahnya.",
    width: 900,
    height: 1600,
    printSize: "3 × 5.3\"",
    overlay: "/templates/night-fest/NF1.png",
    paper: "#1a0b2e",
    slots: [{ x: 70, y: 140, w: 760, h: 1000 }],
    textLayers: [
      {
        text: "{{names}}",
        x: 450,
        y: 1330,
        size: 58,
        align: "center",
        color: "#FF2D95",
        face: "display",
        weight: 800,
        tracking: 3,
        uppercase: true,
        maxWidth: 760,
      },
      {
        text: "{{date}} · {{venue}}",
        x: 450,
        y: 1400,
        size: 24,
        align: "center",
        color: "#E8DFFF",
        face: "mono",
        maxWidth: 760,
      },
      {
        text: "{{hashtag}}",
        x: 450,
        y: 1460,
        size: 22,
        align: "center",
        color: "#00E5FF",
        face: "mono",
        weight: 700,
        tracking: 2,
        uppercase: true,
      },
    ],
  },
  {
    id: "night-fest-2",
    name: "Tiga Foto Neon",
    blurb: "Tiga jepretan berjajar, bingkai magenta dengan aksen grid synthwave.",
    width: 900,
    height: 1600,
    printSize: "3 × 5.3\"",
    overlay: "/templates/night-fest/NF2.png",
    paper: "#150826",
    slots: [
      { x: 70, y: 180, w: 760, h: 380 },
      { x: 70, y: 580, w: 760, h: 380 },
      { x: 70, y: 980, w: 760, h: 380 },
    ],
    textLayers: [
      {
        text: "{{names}}",
        x: 450,
        y: 110,
        size: 38,
        align: "center",
        color: "#FF2D95",
        face: "display",
        weight: 800,
        tracking: 3,
        uppercase: true,
        maxWidth: 760,
      },
      {
        text: "{{date}}",
        x: 450,
        y: 1470,
        size: 26,
        align: "center",
        color: "#E8DFFF",
        face: "mono",
      },
      {
        text: "{{hashtag}}",
        x: 450,
        y: 1520,
        size: 22,
        align: "center",
        color: "#00E5FF",
        face: "mono",
        weight: 700,
        tracking: 2,
        uppercase: true,
      },
    ],
  },
  {
    id: "night-fest-3",
    name: "Dua Foto Neon",
    blurb: "Dua jepretan besar dengan matahari synthwave di atas dan horizon di bawah.",
    width: 900,
    height: 1600,
    printSize: "3 × 5.3\"",
    overlay: "/templates/night-fest/NF3.png",
    paper: "#150826",
    slots: [
      { x: 70, y: 160, w: 760, h: 620 },
      { x: 70, y: 800, w: 760, h: 620 },
    ],
    textLayers: [
      {
        text: "{{names}}",
        x: 450,
        y: 100,
        size: 40,
        align: "center",
        color: "#F3EFFF",
        face: "display",
        weight: 800,
        tracking: 3,
        uppercase: true,
        maxWidth: 760,
      },
      {
        text: "{{venue}}",
        x: 450,
        y: 1500,
        size: 24,
        align: "center",
        color: "#E8DFFF",
        face: "mono",
        maxWidth: 760,
      },
      {
        text: "{{hashtag}}",
        x: 450,
        y: 1550,
        size: 20,
        align: "center",
        color: "#00E5FF",
        face: "mono",
        weight: 700,
        tracking: 2,
        uppercase: true,
      },
    ],
  },
];

export const nightFest = {
  id: "night-fest",
  label: "Night Fest",
  blurb: "Synthwave 80s neon, magenta-cyan — cocok untuk konser & festival musik. 3 bingkai.",
  event,
  frames,
};
