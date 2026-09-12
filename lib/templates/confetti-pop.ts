import type { EventConfig, Template } from "./types";

/**
 * TEMPLATE: Confetti Pop
 *
 * Kategori Ulang Tahun — tema terang, warna-warni, balon & confetti.
 * Beda arah total dari Botanical (elegan/lembut) & Night Fest (neon
 * gelap): terang, playful, garis border pelangi lewat CSS border-image
 * (bukan warna solid), supaya tiap kategori punya bahasa ornamen sendiri.
 */

const event: EventConfig = {
  code: "CONFETTIPOP",
  names: "CONFETTI POP",
  date: "20 Desember 2026",
  venue: "Rumah Keluarga",
  hashtag: "#ConfettiPop2026",
  quota: 250,
  brandLabel: "Happy Birthday",
  greeting:
    "Terima kasih sudah datang merayakan hari ulang tahun ini. Yuk ambil foto seru sepuasnya, lalu titip pesan suara buat yang berulang tahun!",
  voiceNoteEnabled: true,
  maxVoiceSeconds: 15,
  session: {
    countdownSeconds: 3,
    autoContinue: true,
    mirror: true,
    maxRetakes: 3,
    revealMs: 15000,
    filterCss: "brightness(1.1) contrast(1.05) saturate(1.2)",
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
  // Tema TERANG hangat (krem-persik), beda dari Botanical yang juga
  // terang tapi bernuansa emas-cokelat — di sini warnanya jenuh & cerah
  // (coral, kuning, toska, ungu) supaya kesan pesta bukan formal.
  theme: {
    ink: "#FFF6ED",
    film: "#FFE9D6",
    edge: "#FFC98A",
    smoke: "#9C6B4E",
    paper: "#3D1B12",
    flash: "#FF3D82",
    live: "#FF4D4D",
    brandPurple: "#7C4DFF",
    brandGold: "#FFD93D",
    fontDisplay: "var(--font-poppins)",
    canvasFontDisplay: "var(--canvas-font-poppins)",
    decorUrl: "/templates/confetti-pop/decor-tl.png",
    videoBg: "/templates/confetti-pop/bg-video.png",
    effects: {
      petals: { enabled: false, count: 0 },
      blobs: false,
      confetti: true,
      bokeh: false,
      sparkle: true,
    },
    elements: {
      monogram: { mode: "hidden" },
      buttonShape: "pill",
      buttonStyle: "gradient",
      cardRadius: 20,
    },
  },
};

const frames: Template[] = [
  {
    id: "confetti-pop-1",
    name: "Satu Foto Party",
    blurb: "Satu foto besar dengan border pelangi dan balon di keempat sudut.",
    width: 900,
    height: 1600,
    printSize: "3 × 5.3\"",
    overlay: "/templates/confetti-pop/CP1.png",
    paper: "#FFF6ED",
    slots: [{ x: 70, y: 140, w: 760, h: 1000 }],
    textLayers: [
      {
        text: "{{names}}",
        x: 450,
        y: 1320,
        size: 52,
        align: "center",
        color: "#FF3D82",
        face: "display",
        weight: 800,
        uppercase: true,
        maxWidth: 760,
      },
      {
        text: "{{date}} · {{venue}}",
        x: 450,
        y: 1390,
        size: 22,
        align: "center",
        color: "#7A4A2E",
        face: "mono",
        maxWidth: 760,
      },
      {
        text: "{{hashtag}}",
        x: 450,
        y: 1440,
        size: 20,
        align: "center",
        color: "#4ECDC4",
        face: "mono",
        weight: 700,
        tracking: 1,
      },
    ],
  },
  {
    id: "confetti-pop-2",
    name: "Tiga Foto Party",
    blurb: "Tiga jepretan berjajar, tiap slot border pelangi warna beda.",
    width: 900,
    height: 1600,
    printSize: "3 × 5.3\"",
    overlay: "/templates/confetti-pop/CP2.png",
    paper: "#FFE9D6",
    slots: [
      { x: 70, y: 180, w: 760, h: 380 },
      { x: 70, y: 580, w: 760, h: 380 },
      { x: 70, y: 980, w: 760, h: 380 },
    ],
    textLayers: [
      {
        text: "{{names}}",
        x: 450,
        y: 130,
        size: 34,
        align: "center",
        color: "#FF3D82",
        face: "display",
        weight: 800,
        uppercase: true,
        maxWidth: 600,
      },
      {
        text: "{{date}}",
        x: 450,
        y: 1470,
        size: 24,
        align: "center",
        color: "#7A4A2E",
        face: "mono",
      },
      {
        text: "{{hashtag}}",
        x: 450,
        y: 1520,
        size: 20,
        align: "center",
        color: "#4ECDC4",
        face: "mono",
        weight: 700,
      },
    ],
  },
  {
    id: "confetti-pop-3",
    name: "Dua Foto Party",
    blurb: "Dua jepretan besar dengan gerombolan balon di atas dan bawah.",
    width: 900,
    height: 1600,
    printSize: "3 × 5.3\"",
    overlay: "/templates/confetti-pop/CP3.png",
    paper: "#FFF6ED",
    slots: [
      { x: 70, y: 160, w: 760, h: 620 },
      { x: 70, y: 800, w: 760, h: 620 },
    ],
    textLayers: [
      {
        text: "{{names}}",
        x: 450,
        y: 130,
        size: 36,
        align: "center",
        color: "#FF3D82",
        face: "display",
        weight: 800,
        uppercase: true,
        maxWidth: 620,
      },
      {
        text: "{{venue}}",
        x: 450,
        y: 1500,
        size: 22,
        align: "center",
        color: "#7A4A2E",
        face: "mono",
        maxWidth: 700,
      },
      {
        text: "{{hashtag}}",
        x: 450,
        y: 1550,
        size: 18,
        align: "center",
        color: "#4ECDC4",
        face: "mono",
        weight: 700,
      },
    ],
  },
];

export const confettiPop = {
  id: "confetti-pop",
  label: "Confetti Pop",
  blurb: "Balon & border pelangi, tema terang ceria — cocok untuk ulang tahun. 3 bingkai.",
  event,
  frames,
};
