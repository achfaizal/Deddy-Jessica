import type { EventConfig, Template } from "./types";

/**
 * TEMPLATE: Summit
 *
 * Kategori Korporat/Brand Event — pembelinya beda (B2B, bukan
 * perorangan), jadi gayanya sengaja direm: FLAT, tanpa glow/blur sama
 * sekali (beda dari Night Fest yang neon), garis presisi + corner
 * bracket ala tanda register kamera/video, bukan border penuh. Semua
 * efek ambien (confetti/blobs/bokeh/sparkle) dimatikan — kepolosan itu
 * sendiri yang jadi pembeda dari 4 template lain.
 */

const event: EventConfig = {
  code: "SUMMIT",
  names: "SUMMIT",
  date: "20 Desember 2026",
  venue: "Jakarta Convention Center",
  hashtag: "#Summit2026",
  quota: 300,
  brandLabel: "Corporate Gathering",
  greeting:
    "Terima kasih sudah hadir di acara kami. Ambil foto di photobooth ini sebagai kenang-kenangan dari acara hari ini.",
  voiceNoteEnabled: true,
  maxVoiceSeconds: 15,
  session: {
    countdownSeconds: 3,
    autoContinue: true,
    mirror: true,
    maxRetakes: 3,
    revealMs: 15000,
    filterCss: "brightness(1.02) contrast(1.06) saturate(0.98)",
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
  theme: {
    ink: "#14171F",
    film: "#1C212C",
    edge: "#333A4A",
    smoke: "#8A93A6",
    paper: "#F0F2F7",
    flash: "#2E6BFF",
    live: "#FF4D4D",
    brandPurple: "#1E293B",
    brandGold: "#00C2A8",
    fontDisplay: "var(--font-marcellus)",
    canvasFontDisplay: "var(--canvas-font-marcellus)",
    decorUrl: "/templates/summit/decor-tl.png",
    videoBg: "/templates/summit/bg-video.png",
    // SEMUA efek ambien mati — restraint ini yang membedakan Summit dari
    // 4 template lain, bukan sekadar "belum diisi".
    effects: {
      petals: { enabled: false, count: 0 },
      blobs: false,
      confetti: false,
      bokeh: false,
      sparkle: false,
    },
    elements: {
      monogram: { mode: "hidden" },
      buttonShape: "square",
      buttonStyle: "solid",
      cardRadius: 4,
    },
  },
};

const frames: Template[] = [
  {
    id: "summit-1",
    name: "Satu Foto Register",
    blurb: "Satu foto besar dengan tanda sudut presisi ala viewfinder, aksen diagonal biru.",
    width: 900,
    height: 1600,
    printSize: "3 × 5.3\"",
    overlay: "/templates/summit/SU1.png",
    paper: "#14171F",
    slots: [{ x: 70, y: 140, w: 760, h: 1000 }],
    textLayers: [
      {
        text: "{{names}}",
        x: 450,
        y: 1280,
        size: 44,
        align: "center",
        color: "#F0F2F7",
        face: "display",
        weight: 400,
        tracking: 2,
        uppercase: true,
        maxWidth: 720,
      },
      {
        text: "{{date}} · {{venue}}",
        x: 450,
        y: 1335,
        size: 20,
        align: "center",
        color: "#8A93A6",
        face: "mono",
        maxWidth: 720,
      },
      {
        text: "{{hashtag}}",
        x: 450,
        y: 1385,
        size: 16,
        align: "center",
        color: "#00C2A8",
        face: "mono",
        weight: 700,
        tracking: 2,
        uppercase: true,
      },
    ],
  },
  {
    id: "summit-2",
    name: "Tiga Foto Register",
    blurb: "Tiga jepretan berjajar, tanda sudut presisi di tiap slot.",
    width: 900,
    height: 1600,
    printSize: "3 × 5.3\"",
    overlay: "/templates/summit/SU2.png",
    paper: "#14171F",
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
        size: 32,
        align: "center",
        color: "#F0F2F7",
        face: "display",
        weight: 400,
        tracking: 2,
        uppercase: true,
        maxWidth: 620,
      },
      {
        text: "{{date}}",
        x: 450,
        y: 1500,
        size: 22,
        align: "center",
        color: "#8A93A6",
        face: "mono",
      },
      {
        text: "{{hashtag}}",
        x: 450,
        y: 1545,
        size: 16,
        align: "center",
        color: "#00C2A8",
        face: "mono",
        weight: 700,
        tracking: 2,
        uppercase: true,
      },
    ],
  },
  {
    id: "summit-3",
    name: "Dua Foto Register",
    blurb: "Dua jepretan besar, aksen diagonal biru di pojok atas.",
    width: 900,
    height: 1600,
    printSize: "3 × 5.3\"",
    overlay: "/templates/summit/SU3.png",
    paper: "#14171F",
    slots: [
      { x: 70, y: 160, w: 760, h: 620 },
      { x: 70, y: 800, w: 760, h: 620 },
    ],
    textLayers: [
      {
        text: "{{names}}",
        x: 450,
        y: 100,
        size: 34,
        align: "center",
        color: "#F0F2F7",
        face: "display",
        weight: 400,
        tracking: 2,
        uppercase: true,
        maxWidth: 700,
      },
      {
        text: "{{venue}}",
        x: 450,
        y: 1540,
        size: 20,
        align: "center",
        color: "#8A93A6",
        face: "mono",
        maxWidth: 700,
      },
      {
        text: "{{hashtag}}",
        x: 450,
        y: 1580,
        size: 15,
        align: "center",
        color: "#00C2A8",
        face: "mono",
        weight: 700,
        tracking: 2,
        uppercase: true,
      },
    ],
  },
];

export const summit = {
  id: "summit",
  label: "Summit",
  blurb: "Flat & presisi, tanpa glow — cocok untuk korporat & brand event. 3 bingkai.",
  event,
  frames,
};
