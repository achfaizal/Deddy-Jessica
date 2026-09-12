import type { EventConfig, Template } from "./types";

/**
 * TEMPLATE: Wedding (client)
 *
 * BUKAN lagi clone Botanical dengan overlay -token.png — client sudah
 * kirim aset ILUSTRASI ASLI sendiri (public/templates/wedding/{1,2,3,
 * bg-video}.png), dengan "Happy Wedding" & "Deddy & Jessica" SUDAH
 * DIBAKAR ke dalam gambarnya (bukan lagi digambar dinamis lewat
 * textLayers). Ini SENGAJA (bukan pelanggaran setengah-setengah) — lihat
 * CLAUDE.md §4: "Boleh dilanggar sengaja per-bingkai kalau memang
 * bingkainya dirancang khusus satu acara — kosongkan textLayers di
 * kasus itu" — tepat kasus ini, bingkai ini CUMA untuk Deddy & Jessica,
 * tidak akan dipakai ulang acara lain. `textLayers: []` di ketiga bingkai
 * di bawah BUKAN lupa mengisi, tapi memang begitu seharusnya — mengisi
 * ulang nama/tanggal di situ cuma bikin teksnya dobel/bertindih dengan
 * yang sudah tercetak di gambar.
 *
 * Koordinat `slots` di bawah BUKAN ditaksir manual — di-scan langsung
 * dari kanal alpha PNG-nya (area transparan = lubang foto), persis
 * seperti anjuran CLAUDE.md §"Menambah template baru". Dikonfirmasi dulu
 * area lubangnya benar transparan (alpha=0) sebelum dipasang — versi
 * aset SEBELUMNYA sempat area lubangnya hitam SOLID (alpha=255), yang
 * kalau dipasang apa adanya akan menutupi foto tamu total; sudah
 * diperbaiki di sumbernya sebelum baris ini ditulis.
 *
 * `date` (13 September 2026) TIDAK muncul di gambar bingkai/video sama
 * sekali (dicek visual, tidak ada teks tanggal di ketiga PNG maupun
 * bg-video.png) — cuma tercetak di StepResult (struk) & UI lain yang
 * baca event.date langsung, bukan lewat textLayers bingkai ini.
 *
 * SENGAJA TIDAK didaftarkan di PLAYGROUND_TEMPLATES (lihat index.ts) —
 * jadi tidak nongol di katalog "Pilih Template" publik maupun root "/",
 * tapi tetap bisa diakses langsung lewat /t/wedding & /builder/wedding
 * (didaftarkan di CLIENT_TEMPLATES, dicari getTemplate() bareng katalog
 * publik).
 */

const event: EventConfig = {
  code: "WEDDING-CLIENT",
  names: "Deddy & Jessica",
  date: "13 September 2026",
  // TODO(client): ganti dengan lokasi asli — belum diberi datanya.
  venue: "[Isi nama & alamat venue]",
  hashtag: "#DeddyJessica",
  quota: 500,
  brandLabel: "Happy Wedding",
  greeting: "Abadikan momenmu dan tinggalkan ucapan terbaik untuk kami.",
  voiceNoteEnabled: true,
  maxVoiceSeconds: 15,
  session: {
    countdownSeconds: 3,
    autoContinue: true,
    mirror: true,
    maxRetakes: 3,
    revealMs: 10000,
    filterCss: "brightness(1.08) contrast(1.04) saturate(1.12)",
    cameraAspect: "1:1",
    guestNameRequired: true,
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
  // Palet emerald+gold DIMINTA CLIENT — cuma berlaku untuk WARNA TEMA
  // (latar layar, tombol, teks UI, kamera, halaman hasil). Bingkai foto
  // & bg-video SUDAH emerald+gold dari sononya (bagian dari ilustrasi
  // aslinya), jadi otomatis senada tanpa perlu textLayers apa pun lagi.
  theme: {
    ink: "#1E3A34", // Latar Utama — Deep Emerald Green
    film: "#0A0D0C", // Area Konten — Rich Black
    edge: "#284A43", // Latar Aksen — Dark Teal Green
    smoke: "#F3E5AB", // Aksen Cerah — Pale Gold/Champagne (teks sekunder UI)
    paper: "#F5F5F0", // Teks Utama — Off-White/Ivory
    flash: "#D4AF37", // Aksen/Ornamen — Soft Gold
    live: "#A63B2E", // tidak ada di palet client, dibiarkan seperti semula
    // brandPurple DIPAKAI globals.css .btn-primary sebagai UJUNG AWAL
    // gradasi tombol utama (linear-gradient 135deg, brandPurple → flash)
    // — Dark Teal Green di sini sempat bikin tombol "Mulai sesi foto"
    // jadi hijau tua → emas terang, kontrasnya kurang nyambung (dilaporkan
    // lewat screenshot). Champagne (sama dengan brandGold) bikin
    // gradasinya emas-ke-emas yang lebih elegan, juga otomatis
    // memperbaiki bola cahaya ambien (bg-brand-purple) & text-brand-gradient
    // (dua-duanya numpang variable yang sama).
    brandPurple: "#F3E5AB", // Pale Gold/Champagne (BUKAN Dark Teal Green lagi)
    brandGold: "#F3E5AB", // Pale Gold/Champagne
    // Watermark kecil di bawah layar, tampil di semua langkah — diminta
    // eksplisit karena ini template hasil order client sungguhan.
    brandWatermark: "© 2026 Circle Snap. All rights reserved.",
    // Repo deploy khusus acara ini (Deddy-Jessica) — root "/" sudah
    // redirect langsung ke template ini (app/page.tsx), jadi tautan
    // "← Semua template" mubazir buat tamu (klik-nya cuma redirect balik
    // ke sini lagi).
    hideCatalogLink: true,
    // Tekstur titik-titik di latar polos (StepFrame/StepShoot/dst) —
    // diminta eksplisit biar tidak kerasa kosong.
    dotPattern: true,
    fontDisplay: "var(--font-playfair)",
    canvasFontDisplay: "var(--canvas-font-playfair)",
    decorUrl: "/templates/wedding/decor-tl.png",
    // Baked penuh (sudah ada "Happy Wedding" & "Deddy & Jessica" di
    // gambarnya) — BUKAN token, jadi videoTextOnBg TIDAK diisi (default
    // falsy = lib/video.ts tidak menggambar apa pun di atasnya, sama
    // seperti bg-video.png bawaan template lain sebelum ada sistem
    // token). videoTextLayers & videoBgShowcase juga tidak perlu —
    // tidak ada versi lain, cuma satu gambar ini.
    videoBg: "/templates/wedding/bg-video.png",
    // Caption "pesan suara dari {nama}" DIMATIKAN — diminta eksplisit,
    // nama pengirim cukup terlihat di galeri Momen, tidak perlu ikut
    // terekam di videonya. Cuma gelombang suara yang tetap digambar
    // (posisinya otomatis dipusatkan ke sisa ruang kosong di bawah foto
    // begitu caption dimatikan — lihat lib/video.ts).
    videoShowCaption: false,
    // Warna gelombang suara, DIGAMBAR DI ATAS bg-video.png (elemen ini
    // tetap dinamis, beda dari nama/sapaan yang sudah baked) — smoke
    // gelap (emerald) karena latar di titik itu kosong/emerald pekat,
    // bukan krem seperti wedding.ts versi lama.
    videoCard: {
      bg: "#1E3A34",
      ink: "#F5F5F0",
      smoke: "#F5F5F0",
      waveActive: "#D4AF37",
      waveTrack: "#284A43",
      headingGradient: ["#D4AF37", "#D4AF37", "#D4AF37"],
    },
    elements: {
      monogram: { mode: "hidden" },
      // Foto asli Deddy & Jessica (sudah diunggah client) — bukan foto
      // contoh lagi.
      heroPhoto: { mode: "cover", url: "/templates/wedding/hero.jpg", overlay: 90 },
      kickerFont: "display",
      // Menggemakan siluet lengkung lubang foto bingkai (lihat komentar
      // buttonShape "arch" di lib/templates/types.ts) — diminta eksplisit
      // biar template ini tidak kerasa generik/sama kayak template lain
      // yang semuanya pil bulat penuh.
      buttonShape: "arch",
    },
    // Kelopak/daun melayang (petal) dimatikan — diminta eksplisit,
    // dianggap mengganggu di atas foto sambutan & bingkai yang sudah
    // punya motif daun emas sendiri (decor-tl.png). Sebagai gantinya,
    // bokeh (bulatan cahaya melayang naik, komponen BOKEH bawaan di
    // WelcomeScreen.tsx) dinyalakan — warnanya sudah ikut token tema
    // (--color-flash / --color-brand-gold / --color-brand-purple, yang
    // semuanya emas/champagne di template ini) jadi otomatis nuansa
    // kuning-samar tanpa perlu warna baru yang di-hardcode.
    effects: { petals: { enabled: false, count: 0 }, blobs: true, confetti: false, bokeh: true },
  },
};

const frames: Template[] = [
  {
    id: "wedding-1",
    name: "Satu Foto",
    blurb: "Satu foto besar bingkai lengkung emas, cocok untuk potret utuh.",
    width: 1080,
    height: 1920,
    printSize: "3.6 × 6.5\"",
    overlay: "/templates/wedding/1.png",
    paper: "#1E3A34",
    // Di-scan dari kanal alpha 1.png (lihat komentar atas berkas ini).
    slots: [{ x: 103, y: 520, w: 701, h: 1049 }],
    // "Happy Wedding" & "Deddy & Jessica" sudah tercetak di gambar —
    // lihat komentar atas berkas ini kenapa dikosongkan, bukan lupa.
    textLayers: [],
  },
  {
    id: "wedding-2",
    name: "Dua Foto",
    blurb: "Dua jepretan bingkai lengkung emas, tersusun bertumpuk.",
    width: 800,
    height: 1966,
    printSize: "2.7 × 6.6\"",
    overlay: "/templates/wedding/2.png",
    paper: "#1E3A34",
    slots: [
      { x: 92, y: 555, w: 605, h: 426 },
      { x: 58, y: 1077, w: 639, h: 426 },
    ],
    textLayers: [],
  },
  {
    id: "wedding-3",
    name: "Tiga Foto",
    blurb: "Tiga jepretan bingkai lengkung emas berselang-seling.",
    width: 800,
    height: 1966,
    printSize: "2.7 × 6.6\"",
    overlay: "/templates/wedding/3.png",
    paper: "#1E3A34",
    slots: [
      { x: 114, y: 438, w: 639, h: 426 },
      { x: 57, y: 936, w: 605, h: 426 },
      { x: 114, y: 1433, w: 639, h: 426 },
    ],
    textLayers: [],
  },
];

export const wedding = {
  id: "wedding",
  label: "Wedding (Client)",
  blurb: "Bingkai emas asli client (Deddy & Jessica) — teks sudah tercetak di gambar. Tidak tampil di katalog publik.",
  event,
  frames,
};
