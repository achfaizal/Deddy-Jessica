import type { EventConfig, Template } from "./types";

/**
 * TEMPLATE: Lamaran
 *
 * Satu template = satu paket siap jual: identitas acara contoh + tema +
 * bingkainya sendiri. PNG bingkai ada di public/templates/lamaran/ —
 * folder bernama sama dengan id template ini, supaya "template ↔
 * berkasnya" langsung terbaca tanpa menelusuri berkas lain.
 *
 * Menambah template baru = salin pola berkas ini (event + frames di satu
 * berkas), taruh PNG-nya di public/templates/<id>/, lalu daftarkan di
 * lib/templates/index.ts. Tidak ada langkah lain — tidak ada database,
 * tidak ada admin untuk diberi tahu.
 */

// Warna teks bingkai & kartu video — SAMA dengan theme.flash/theme.smoke
// di bawah, tapi wajib hex literal terpisah di sini: compositor.ts
// menggambar ke <canvas> lewat ctx.fillStyle, bukan CSS, jadi tidak bisa
// baca var(--color-flash). Kalau salah satu ganti warna, ganti semuanya.
// Dipindah ke ATAS (sebelumnya di bawah `frames`) supaya bisa dipakai di
// `event.theme.videoTextLayers` juga, bukan cuma `frames`.
const GOLD = "#A98D4A"; // = theme.flash
const SMOKE = "#6B5D3F"; // = theme.smoke

const event: EventConfig = {
  code: "LAMARAN",
  names: "Salma & Faizal",
  date: "8 Agustus 2026",
  venue: "Gedung Pernikahan",
  hashtag: "#SalmaFaizal",
  quota: 200,
  brandLabel: "Happy Engagement",
  greeting:
    "Terima kasih sudah datang di acara lamaran kami. Ambil foto sebanyak yang kamu mau, lalu titip pesan suara untuk kami.",
  voiceNoteEnabled: true,
  maxVoiceSeconds: 15,
  session: {
    countdownSeconds: 3,
    autoContinue: true,
    mirror: true,
    maxRetakes: 3,
    revealMs: 15000,
    filterCss: "brightness(1.08) contrast(1.04) saturate(1.12)",
    cameraAspect: "1:1",
    guestNameRequired: true,
    // Galeri "Momen" diunggah ke server (Vercel Blob di production / folder
    // lokal saat dev, lihat lib/moments.ts) — bersama lintas HP, bukan lagi
    // per-perangkat seperti versi IndexedDB sebelumnya (diporting dari
    // glyka-virtual-photobooth 2026-09-13).
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
  // Tema TERANG: `ink` krem terang (latar halaman), `paper` cokelat tua
  // (teks utama). flash/brandGold jadi nuansa emas supaya senada dengan
  // bingkai botanical-nya.
  theme: {
    ink: "#F3F3E9",
    film: "#EAE7D8",
    edge: "#C9B78A",
    smoke: "#6B5D3F",
    paper: "#2E2A1E",
    flash: "#A98D4A",
    live: "#A63B2E",
    brandPurple: "#7A5E28",
    brandGold: "#D8C08A",
    fontDisplay: "var(--font-playfair)",
    canvasFontDisplay: "var(--canvas-font-playfair)",
    decorUrl: "/templates/lamaran/decor-tl.png",
    // Token (kosong di zona teks) — dipakai Builder & sesi tamu asli,
    // sapaan/nama/tanggal digambar dinamis (lihat videoTextOnBg &
    // lib/video.ts). Versi baked "Sal & Sal" (bg-video.png) tetap ada di
    // videoBgShowcase, khusus /t/[id].
    videoBg: "/templates/lamaran/bg-video-token.png",
    videoTextOnBg: true,
    videoBgShowcase: "/templates/lamaran/bg-video.png",
    // Warna teks kartu video, SENGAJA diisi (bukan pakai DEFAULT_VIDEO_CARD
    // di lib/video.ts yang gradasi ungu-pink-emas) — sekarang teksnya
    // beneran digambar di atas bg-video-token.png (videoTextOnBg: true),
    // gradasi warna-warni itu bentrok dengan botanical emas-krem satu
    // nuansa. headingGradient diisi GOLD tiga kali (bukan gradasi
    // sungguhan) supaya efeknya solid emas, senada dengan warna teks
    // bingkai (GOLD/SMOKE di frames di bawah).
    videoCard: {
      bg: "#F3F3E9",
      ink: "#2E2A1E",
      smoke: "#6B5D3F",
      waveActive: "#A98D4A",
      waveTrack: "#E3DCC5",
      headingGradient: ["#A98D4A", "#A98D4A", "#A98D4A"],
    },
    // Sapaan+nama di zona atas (y sama dengan posisi lama di lib/video.ts
    // sebelum dipindah ke sistem ini), tanggal di zona bawah — posisi
    // diukur visual dari bg-video-token.png (lihat komentar videoTextOnBg
    // di types.ts), BELUM diverifikasi lewat video sungguhan yang
    // di-render (sesi kerja ini tidak punya browser untuk cek visual).
    // {{brandLabel}} BUKAN token dari tokensFor() biasa — lib/video.ts
    // yang menambahkannya sendiri ke tokens sebelum menggambar.
    videoTextLayers: [
      { text: "{{brandLabel}}", x: 540, y: 108, size: 46, align: "center", color: GOLD, face: "display", weight: 600, label: "Sapaan" },
      { text: "{{names}}", x: 540, y: 178, size: 56, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 900, label: "Nama" },
      { text: "{{date}}", x: 540, y: 1850, size: 42, align: "center", color: SMOKE, face: "display", weight: 600, label: "Tanggal" },
    ],
    elements: {
      // Logo inisial ("S · F") dihilangkan — digantikan foto sambutan di
      // bawah sebagai elemen utama layar Selamat Datang.
      monogram: { mode: "hidden" },
      // Foto sambutan bawaan template ini (bukan hasil upload user) — host
      // masih bisa ganti/hapus lewat Builder (tab Tampilan) kapan pun,
      // ini cuma nilai AWAL supaya Botanical langsung tampil lengkap tanpa
      // perlu diatur dulu. "cover" dipilih (bukan "banner") karena mode
      // ini tidak punya batas foto/latar-polos di tengah layar yang perlu
      // "disambung" — lebih aman dari seam waktu foto berupa kolase
      // banyak panel begini.
      heroPhoto: { mode: "cover", url: "/templates/lamaran/hero.jpg", overlay: 90 },
      // Kicker ("Happy Engagement") pakai font judul (Playfair) diperbesar,
      // bukan mono kecil huruf besar bawaan — lebih senada dengan gaya
      // botanical yang elegan/klasik.
      kickerFont: "display",
    },
  },
};

const frames: Template[] = [
  {
    id: "lamaran-1",
    name: "Satu Foto Botanical",
    blurb: "Satu foto besar bergaya botanical garis emas, cocok untuk potret utuh.",
    width: 1080,
    height: 1920,
    printSize: "3.6 × 6.5\"",
    // -token.png = versi POLOS (rings & dekorasi tetap, tanpa "SAL & SAL"
    // yang dulu digambar tangan langsung ke PNG-nya) — nama & tanggal
    // sekarang digambar compositor dari textLayers di bawah, ikut nama
    // ACARA INI, bukan nama contoh selamanya. ENG1.png (versi lama, nama
    // "Sal & Sal" baked-in) sengaja dibiarkan di folder sebagai referensi
    // visual, bukan lagi dipakai sebagai overlay aktif.
    overlay: "/templates/lamaran/ENG1-token.png",
    // Versi baked "Sal & Sal" — cuma buat /t/[id] (lihat showcaseOverlay
    // di types.ts), bukan overlay aktif untuk Builder/sesi tamu asli.
    showcaseOverlay: "/templates/lamaran/ENG1.png",
    paper: "#F3F3E9",
    slots: [{ x: 367, y: 629, w: 645, h: 942 }],
    textLayers: [
      { text: "ENGAGEMENT", x: 540, y: 300, size: 30, align: "center", color: SMOKE, face: "display", tracking: 5, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 540, y: 425, size: 110, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 960, label: "Nama" },
      { text: "{{date}}", x: 540, y: 1830, size: 68, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 960, label: "Tanggal" },
    ],
  },
  {
    id: "lamaran-2",
    name: "Tiga Foto Botanical",
    blurb: "Tiga jepretan berjajar dengan aksen bunga garis emas.",
    width: 800,
    height: 1966,
    printSize: "2.7 × 6.6\"",
    overlay: "/templates/lamaran/ENG2-token.png",
    showcaseOverlay: "/templates/lamaran/ENG2.png",
    paper: "#F3F3E9",
    slots: [
      { x: 119, y: 396, w: 567, h: 379 },
      { x: 113, y: 915, w: 567, h: 379 },
      { x: 113, y: 1421, w: 567, h: 379 },
    ],
    // Header di sini lebih pendek (foto pertama mulai y=396) daripada
    // bingkai-1, jadi ukurannya diperkecil supaya tidak nabrak foto.
    textLayers: [
      { text: "ENGAGEMENT", x: 400, y: 130, size: 22, align: "center", color: SMOKE, face: "display", tracking: 4, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 400, y: 225, size: 62, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 700, label: "Nama" },
      { text: "{{date}}", x: 400, y: 1910, size: 42, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 700, label: "Tanggal" },
    ],
  },
  {
    id: "lamaran-3",
    name: "Dua Foto Botanical",
    blurb: "Dua jepretan besar dengan tanggal di atas dan tanda tangan di bawah.",
    width: 800,
    height: 1966,
    printSize: "2.7 × 6.6\"",
    overlay: "/templates/lamaran/ENG3-token.png",
    showcaseOverlay: "/templates/lamaran/ENG3.png",
    paper: "#F3F3E9",
    slots: [
      { x: 101, y: 230, w: 607, h: 682 },
      { x: 110, y: 1027, w: 589, h: 694 },
    ],
    // Kebalikan dari bingkai-1: tanggal di atas (sebelum foto pertama di
    // y=230), nama+label di footer sempit setelah foto kedua. Posisi ini
    // SUDAH DIKOREKSI DUA KALI dari percobaan pertama — diverifikasi
    // lewat capture sungguhan tiap kali. Percobaan ke-2 (y=1785/1875)
    // MASIH menimpa tepi foto kedua: slot berakhir "cuma" di y=1721
    // secara koordinat mentah, tapi border putih ala-polaroid di sekitar
    // foto (bagian dari gambar -token.png, bukan dihitung compositor)
    // menambah tinggi visual ekstra yang tidak tercatat di angka slot
    // ini — makanya jarak amannya digeser jauh lebih longgar (bukan cuma
    // pas-pasan di atas y=1721), sampai benar-benar bersih dari foto di
    // capture sungguhan.
    textLayers: [
      { text: "{{date}}", x: 400, y: 220, size: 56, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 700, label: "Tanggal" },
      { text: "ENGAGEMENT", x: 400, y: 1820, size: 20, align: "center", color: SMOKE, face: "display", tracking: 4, uppercase: true, label: "Label" },
      { text: "{{names}}", x: 400, y: 1900, size: 48, align: "center", color: GOLD, face: "display", weight: 600, maxWidth: 700, label: "Nama" },
    ],
  },
];

export const lamaran = {
  id: "lamaran",
  label: "Botanical",
  blurb: "Garis emas botanical, tema terang — cocok untuk lamaran & pernikahan klasik. 3 bingkai.",
  event,
  frames,
};
