import type { CSSProperties } from "react";

/**
 * BENTUK SATU TEMPLATE PLAYGROUND
 *
 * Template = kontrak antara desainer bingkai dan mesin compositing
 * (lib/compositor.ts). Aturan yang menentukan model bisnisnya: PNG overlay
 * tidak boleh memuat teks yang berubah per acara. Nama, tanggal, tempat,
 * dan tagar didefinisikan sebagai `textLayers` dan digambar saat
 * compositing dari data event — satu bingkai karena itu bisa dipakai ulang
 * oleh acara lain tanpa desain ulang.
 *
 * Semua tipe playground (event, tema, bingkai) hidup di satu berkas ini
 * supaya menambah template baru (lib/templates/<nama>.ts) cukup mengimpor
 * dari sini, tidak perlu menelusuri banyak berkas tipe terpisah.
 */

export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Token yang boleh dipakai: {{names}} {{date}} {{venue}} {{hashtag}} {{code}} */
export interface TextLayer {
  text: string;
  x: number;
  y: number;
  size: number;
  align: CanvasTextAlign;
  color: string;
  face: "display" | "mono";
  /** Font family CSS literal (mis. `"Times New Roman", serif`) — dipilih
      user per-teks lewat Builder → Edit Bingkai. Kosong (bawaan) = ikut
      `face` di atas (tema template). TERISI menimpa `face` sepenuhnya
      untuk layer ini saja, tidak memengaruhi layer lain atau tema
      keseluruhan. Font sistem (Times New Roman dkk) aman langsung dipakai
      tanpa next/font karena sudah tersedia di semua browser — beda dari
      aturan "3 langkah sinkron" CLAUDE.md §4 yang khusus font KOLEKSI
      (Playfair dkk, lihat FONT_OPTIONS di Builder.tsx). */
  fontFamily?: string;
  weight?: number;
  /** Miring — ditambah ke string `ctx.font` (lihat lib/compositor.ts). */
  italic?: boolean;
  /** Jarak antarhuruf dalam px kanvas ekspor. */
  tracking?: number;
  uppercase?: boolean;
  /** Ukuran font mengecil otomatis bila teks melebihi lebar ini. */
  maxWidth?: number;
  /** Multi-baris: kelipatan ukuran font. Default 1.2. */
  lineHeight?: number;
  /** Sembunyikan tanpa menghapus dari array — mis. template tidak mau
      menampilkan tagar untuk acara tertentu. */
  hidden?: boolean;
  /** Nama layer untuk editor visual (kalau ada nanti). Kosong = pakai
      cuplikan teksnya. */
  label?: string;
}

export interface Template {
  id: string;
  name: string;
  blurb: string;
  width: number;
  height: number;
  printSize: string;
  slots: Slot[];
  /** PNG siap pakai — WAJIB diisi kecuali `ornament` (di bawah) diisi
      sebagai gantinya. Dua-duanya kosong = bingkai kertas polos tanpa
      hiasan (bukan error, tapi hampir pasti bukan yang diinginkan). */
  overlay?: string;
  /** Ornamen digambar LANGSUNG lewat kode (path/gradient/pola canvas),
      dipakai kalau `overlay` kosong — untuk bingkai yang tidak punya PNG
      ilustrasi (lihat README §"Menambah template baru — ornamen kode").
      `w`/`h` = ukuran kanvas SETELAH scale (sama seperti canvas.width/
      height composeBase()) — hitung semua posisi/ketebalan garis sebagai
      PECAHAN dari w/h (mis. `w * 0.003` buat lebar garis), BUKAN angka
      piksel tetap, supaya proporsional baik di pratinjau kecil Builder
      maupun ekspor resolusi penuh. Dipanggil composeBase() persis di
      urutan yang sama dengan overlay PNG (setelah kertas+foto, sebelum
      textLayers). */
  ornament?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  /** Warna dasar bila overlay gagal dimuat — mencegah kanvas hitam. */
  paper: string;
  textLayers: TextLayer[];
  /** PNG versi "sudah jadi" (nama contoh baked langsung ke gambar, mis.
      ENG1.png "Sal & Sal") — dipakai KHUSUS route /t/[id] (kartu katalog
      /dashboard/templates & modal Preview-nya) supaya calon user lihat
      contoh hasil jadi yang rapi sebelum memutuskan, BUKAN dipakai
      Builder atau sesi tamu asli (/e/[id] tetap `overlay` di atas +
      textLayers dinamis — itu tahap "mengcustome"-nya). Kosong = /t/[id]
      fallback ke `overlay` biasa (belum ada versi baked-nya). Lihat
      app/t/[id]/page.tsx untuk pemakaiannya. */
  showcaseOverlay?: string;
}

/** Elemen-elemen layar Selamat Datang yang bisa diatur per template, di
    luar warna & font. Semua opsional — kosong = tampilan bawaan (monogram
    dari inisial nama, tanpa foto besar). */
export interface ThemeElements {
  monogram?: { mode: "initials" | "image" | "hidden"; url?: string; size?: number; ring?: boolean };
  /** "cover" = latar penuh satu layar. "banner" = pita landscape di atas
      konten (bukan penuh layar), pudar ke warna latar di ujung bawahnya
      sendiri — dua-duanya pakai `overlay` buat kegelapan gradasinya. */
  heroPhoto?: {
    mode: "hidden" | "circle" | "banner" | "cover";
    url?: string;
    size?: number;
    overlay?: number;
    /** Perbesar foto di dalam bingkai `object-fit: cover` — 1 = pas
        (bawaan), >1 memperbesar (zoom in). `posX`/`posY` (0-100, bawaan
        50/50) menggeser titik fokusnya, dipakai bareng sebagai
        `object-position` DAN `transform-origin` supaya zoom-nya terasa
        memusat di titik yang sama dengan geseran, bukan dari sudut kiri
        atas. Diatur user lewat drag+slider di Builder (tab Edit). */
    zoom?: number;
    posX?: number;
    posY?: number;
  };
  /** Gaya teks kicker (baris kecil sebelum judul nama, mis. "Happy
      Wedding"). Default "mono" = font monospace kecil huruf besar
      berjarak — cocok untuk tema modern/tech (Night Fest, Summit).
      "display" pakai font judul (fontDisplay tema ini) ukuran lebih
      besar, warna SAMA dengan judul nama (text-paper) — untuk tema
      elegan/klasik (Botanical). */
  kickerFont?: "mono" | "display";
  /** "arch" = melengkung penuh di ATAS, rata/sedikit membulat di BAWAH —
      menggemakan siluet lubang foto lengkung (mis. wedding.ts, bingkai
      client dengan bentuk arch/jendela gereja), supaya tombol & elemen
      lain di booth "menggemakan" bentuk bingkainya, bukan cuma pil
      generik yang sama di semua template. */
  buttonShape?: "pill" | "rounded" | "square" | "arch";
  buttonStyle?: "gradient" | "solid" | "outline";
  cardRadius?: number;
}

export interface VideoCardTheme {
  bg: string;
  ink: string;
  smoke: string;
  waveActive: string;
  waveTrack: string;
  /** Gradasi judul: [awal, tengah, akhir] */
  headingGradient: [string, string, string];
}

/**
 * Tema visual per template. Semua nilai warna adalah CSS custom property
 * yang dipakai ulang oleh setiap util Tailwind (`bg-flash`, `text-smoke`,
 * `.btn-primary`, dst.) lewat `var(--color-*)` — menerapkan tema cukup
 * dengan override variable ini di elemen pembungkus sesi.
 */
export interface EventTheme {
  ink: string;
  film: string;
  edge: string;
  smoke: string;
  paper: string;
  flash: string;
  live: string;
  brandPurple: string;
  brandGold: string;
  /** Watermark teks kecil di bawah layar, tampil di SEMUA langkah (Selamat
      Datang sampai struk) — diminta eksplisit untuk template hasil order
      client sungguhan (mis. wedding.ts), supaya jelas ini "by Circle
      Snap". Kosong (bawaan) = tidak ada watermark sama sekali, template
      lain TIDAK berubah. Dirender EventBooth.tsx (satu-satunya wrapper
      yang otomatis melingkupi semua langkah). */
  brandWatermark?: string;
  /** Nilai `--font-display` pengganti, mis. `var(--font-playfair)`. */
  fontDisplay?: string;
  /** Pasangan wajib dari `fontDisplay` — lib/compositor.ts TIDAK BISA
      membaca CSS variable berlapis untuk menggambar teks ke <canvas>,
      jadi field terpisah ini wajib diisi BARENGAN. Lihat app/layout.tsx
      untuk daftar var `--canvas-font-*` yang tersedia. */
  canvasFontDisplay?: string;
  /** URL PNG dekorasi sudut (transparan), dipantulkan 4 arah lewat CSS. */
  decorUrl?: string;
  /** Dekorasi sudut versi KODE (SVG, lewat components/CornerOrnament.tsx)
      — dipakai kalau `decorUrl` kosong (template tanpa PNG ilustrasi,
      mis. wedding.ts dkk yang bingkainya juga digambar kode lewat
      Template.ornament). Nama variannya SENGAJA senada dengan motif
      ornament bingkai template yang sama (floral untuk wedding.ts, ring
      untuk engagement-modern.ts, dst) — supaya kesan visual sepanjang
      sesi tamu (bukan cuma bingkai fotonya) tetap satu identitas.
      `decorUrl` MENANG kalau dua-duanya diisi (PNG asli tetap
      diprioritaskan). Warnanya ikut var(--color-flash)/var(--color-brand-gold)
      tema aktif secara otomatis (currentColor), tidak perlu diatur di
      sini. */
  decorSvg?: "floral" | "ring" | "sunburst" | "laurel";
  /** true = tekstur titik-titik halus (dot grid) di SELURUH latar polos
      sesi (StepFrame/StepShoot/dst yang bg-nya cuma warna rata, bukan
      foto) — diminta eksplisit supaya latar polos tidak kerasa kosong.
      Murni CSS (radial-gradient diulang, bukan gambar), warnanya ikut
      var(--color-flash) tema aktif otomatis lewat color-mix, jadi tetap
      senada berapa pun temanya kalau template lain nanti ikut memakai
      ini. Kosong/false = latar polos biasa (perilaku lama, semua
      template selain wedding.ts). */
  dotPattern?: boolean;
  elements?: ThemeElements;
  /** Latar penuh 1080×1920 siap pakai untuk kartu video pesan suara — kalau
      diisi, gantikan latar putih bawaan. Dua kemungkinan (lihat
      `videoTextOnBg` di bawah): BAKED (sapaan/nama/tanggal sudah tercetak
      di gambarnya sendiri, lib/video.ts tidak menggambar ulang — perilaku
      lama) atau TOKEN (gambar kosong di zona teksnya, lib/video.ts WAJIB
      menggambar sapaan/nama/tanggal dinamis di atas). */
  videoBg?: string;
  /** true = `videoBg` di atas versi TOKEN (kosong di zona teks) —
      sapaan+nama digambar dinamis di atas (posisi sama seperti latar
      putih bawaan), tanggal digambar TERPISAH di zona bawah (lihat
      lib/video.ts, posisi diukur dari bg-video-token.png lamaran).
      Kosong/false = `videoBg` BAKED lengkap, tidak digambar ulang
      (perilaku lama — dipakai template yang belum punya versi token). */
  videoTextOnBg?: boolean;
  /** Versi BAKED (nama contoh sudah tercetak, mis. bg-video.png "Sal &
      Sal") — dipakai KHUSUS route /t/[id] (kartu katalog & modal Preview,
      sama pola dengan Template.showcaseOverlay) supaya calon user lihat
      contoh hasil jadi, BUKAN dipakai Builder/sesi tamu asli (tetap
      `videoBg` token + teks dinamis di atas — itu tahap "mengcustome"-nya).
      Kosong = /t/[id] fallback ke `videoBg` apa adanya. */
  videoBgShowcase?: string;
  /** Sapaan+nama+tanggal di atas `videoBg` versi TOKEN — SATU-SATUNYA
      dipakai kalau `videoTextOnBg` true (lihat lib/video.ts). Boleh pakai
      token `{{names}}` {{date}} {{venue}} {{hashtag}} {{code}} SEPERTI
      TextLayer bingkai, DITAMBAH `{{brandLabel}}` (khusus di sini, bukan
      bagian tokensFor() global — lib/video.ts yang menambahkannya sendiri
      ke tokens sebelum menggambar). Diedit lewat Builder → Edit Bingkai,
      muncul sebagai bingkai ke-4 semu "Kartu Video" di daftar (lihat
      VIDEO_CARD_FRAME_ID di lib/templates/index.ts) — override-nya
      tersimpan di EventConfig.frameTextLayers[VIDEO_CARD_FRAME_ID], POLA
      SAMA dengan override bingkai biasa, bukan mekanisme baru. Kosong =
      "Kartu Video" tidak ditawarkan sama sekali di Builder (belum ada
      template lain yang punya versi token selain lamaran). */
  videoTextLayers?: TextLayer[];
  /** false = caption "pesan suara dari {nama}" TIDAK digambar di video
      kartu suara sama sekali (lib/video.ts) — diminta eksplisit: nama
      pengirim cukup terlihat di galeri Momen (MomentsGallery.tsx,
      komponen terpisah, tidak kena field ini), tidak perlu ikut
      terekam di video yang diunduh/dibagikan. Kosong/true = perilaku
      lama, caption tetap ada (semua template selain wedding.ts). */
  videoShowCaption?: boolean;
  effects?: {
    petals: { enabled: boolean; count: number };
    blobs: boolean;
    confetti: boolean;
    bokeh?: boolean;
    sparkle?: boolean;
  };
  videoCard?: VideoCardTheme;
}

/** Variable CSS yang dipakai ulang oleh setiap util Tailwind di seluruh
    komponen langkah. Override di sini saja sudah cukup untuk mengubah
    tampilan keseluruhan sesi. Komponen yang di-render lewat portal (di
    luar wrapper tema EventBooth) wajib menerapkan ini sendiri di root
    elemennya — CSS variable inline style tidak ikut terbawa lewat portal. */
export function themeVars(theme: EventTheme): CSSProperties {
  return {
    "--color-ink": theme.ink,
    "--color-film": theme.film,
    "--color-edge": theme.edge,
    "--color-smoke": theme.smoke,
    "--color-paper": theme.paper,
    "--color-flash": theme.flash,
    "--color-live": theme.live,
    "--color-brand-purple": theme.brandPurple,
    "--color-brand-gold": theme.brandGold,
    ...(theme.fontDisplay ? { "--font-display": theme.fontDisplay } : {}),
    ...(theme.canvasFontDisplay ? { "--canvas-display": theme.canvasFontDisplay } : {}),
  } as CSSProperties;
}

/** Override teks antarmuka per template. Kosong = pakai default
    lib/copy.ts. Dibaca lewat resolveCopy(), bukan langsung. */
export interface CopyOverrides {
  welcomeKicker?: string;
  welcomeCta?: string;
  welcomeMomentsCta?: string;
  guestNamePlaceholder?: string;

  stepFrame?: string;
  stepShoot?: string;
  stepVoice?: string;
  stepResult?: string;

  /** Default memecah `names` pakai " & " — rapuh untuk acara non-pernikahan
      atau format nama lain. Override di sini jalan keluarnya. */
  voiceTitle?: string;
  voiceIntro?: string;

  momentsTitle?: string;
  momentsEmpty?: string;

  quotaExhaustedTitle?: string;
  quotaExhaustedBody?: string;
}

export interface EventConfig {
  /** Selalu kosong di playground statis — kuota diklaim lokal (lihat
      bumpUsed di lib/templates/index.ts), tidak pernah lewat server. */
  id?: string;
  status?: "draft" | "live" | "ended" | "expired";
  code: string;
  names: string;
  date: string;
  venue: string;
  hashtag: string;
  /** Jumlah strip yang "dibeli" klien, bukan jumlah jepretan. */
  quota: number;
  /** Pesan sambutan dari tuan rumah, muncul sebelum sesi dimulai. */
  greeting: string;
  voiceNoteEnabled: boolean;
  maxVoiceSeconds: number;
  theme?: EventTheme;
  /** Sapaan besar di header sesi & kartu video pesan suara — "Happy
      Wedding" kalau kosong. */
  brandLabel?: string;
  session?: {
    countdownSeconds?: 0 | 3 | 5 | 10;
    autoContinue?: boolean;
    mirror?: boolean;
    maxRetakes?: number;
    revealMs?: number;
    filterCss?: string;
    cameraAspect?: "1:1" | "4:5" | "3:4";
    guestNameRequired?: boolean;
    moments?: {
      enabled?: boolean;
      showGuestName?: boolean;
    };
    share?: {
      instagram?: boolean;
      whatsapp?: boolean;
      nativeShare?: boolean;
      downloadPng?: boolean;
      downloadJpg?: boolean;
      downloadVideo?: boolean;
    };
  };
  copy?: CopyOverrides;
  /** Bingkai bawaan template asal yang DIMATIKAN user lewat Builder (tab
      Bingkai) — daftar `Template.id`. Tidak menghapus dari katalog
      (template.frames tetap utuh), cuma disaring saat sesi tamu dimulai
      (lihat EventBooth.tsx). */
  disabledFrameIds?: string[];
  /** Bingkai unggahan user sendiri, TAMBAHAN di luar bingkai bawaan
      template. Dibuat lewat Builder → Bingkai → upload PNG transparan;
      slot-nya dideteksi otomatis dari lubang transparan (lihat
      lib/frameDetect.ts), bisa dikoreksi manual sebelum disimpan.
      `textLayers` selalu kosong (lihat aturan di types.ts atas: bingkai
      unggahan user itu spesifik satu acara, bukan dipakai ulang lintas
      acara seperti bingkai katalog). */
  customFrames?: Template[];
  /** Override `textLayers` PER BINGKAI, kunci = `Template.id` — dibuat
      lewat Builder → Edit Bingkai (drag posisi, edit isi, tambah/hapus
      teks). Kalau ADA untuk suatu bingkai, MENGGANTIKAN SELURUH
      `textLayers` bawaan bingkai itu (bukan menambah) — begitu juga
      dipakai EventBooth.tsx (effectiveTemplates) saat tamu sungguhan
      sesi foto, supaya hasil cetak persis yang dilihat di Builder. Kunci
      yang tidak ada di sini = bingkai itu masih pakai textLayers bawaan
      template apa adanya. */
  frameTextLayers?: Record<string, TextLayer[]>;
}
