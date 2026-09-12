"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EventConfig, Template } from "@/lib/templates";
import { readUsed, themeVars, VIDEO_CARD_FRAME_ID } from "@/lib/templates";
import { resolveCopy } from "@/lib/copy";
import { useSession } from "@/lib/store";
import CornerOrnament from "./CornerOrnament";
import StepFrame from "./StepFrame";
import StepResult from "./StepResult";
import StepShoot from "./StepShoot";
import StepVoice from "./StepVoice";
import WelcomeScreen from "./WelcomeScreen";

// Label sesi yang tampil di bawah nama acara — cukup teks kecil, bukan
// bilah progress, supaya tamu tetap tahu sedang di langkah mana tanpa
// header jadi ramai lagi. Sejak ada CopyOverrides, keempatnya diambil
// dari resolveCopy() (klien bisa mengubah lewat Visual Builder → Teks),
// bukan konstanta modul seperti dulu.

/** Bokeh — bulatan cahaya naik pelan (lihat .bokeh & @keyframes bokeh-rise
    di globals.css). Ukuran/posisi/tempo sengaja tidak seragam supaya
    tidak terlihat seperti barisan gelembung buatan mesin. Sama persis
    dengan array di WelcomeScreen.tsx sebelum dipindah ke sini supaya
    tampil di semua langkah, bukan cuma layar sambutan. */
const BOKEH = [
  { left: "8%", size: 90, color: "var(--color-flash)", duration: "17s", delay: "0s", opacity: 0.35 },
  { left: "26%", size: 54, color: "var(--color-brand-gold)", duration: "22s", delay: "5s", opacity: 0.3 },
  { left: "44%", size: 120, color: "var(--color-brand-purple)", duration: "19s", delay: "9s", opacity: 0.25 },
  { left: "63%", size: 68, color: "var(--color-flash)", duration: "25s", delay: "2.5s", opacity: 0.32 },
  { left: "80%", size: 100, color: "var(--color-brand-gold)", duration: "20s", delay: "12s", opacity: 0.28 },
  { left: "92%", size: 46, color: "var(--color-brand-purple)", duration: "16s", delay: "7s", opacity: 0.3 },
];

/**
 * Menerima `event` & daftar bingkai dari pemanggil (route server component,
 * lihat app/page.tsx / app/t/[id]/page.tsx) — keduanya datang langsung
 * dari registry statis (lib/templates/), tidak pernah lewat fetch. Kuota
 * terpakai TIDAK dioper sebagai prop: dibaca dari localStorage di effect
 * di bawah, karena hanya browser tamu yang tahu berapa sudah dipakai di
 * perangkat itu (lihat lib/templates/index.ts § kuota lokal).
 */
export default function EventBooth({
  event: eventConfig,
  templates,
}: {
  event: EventConfig;
  templates: Template[];
}) {
  const { event, step, used, attach } = useSession();
  const [entered, setEntered] = useState(false);

  // Bingkai EFEKTIF untuk sesi ini = bingkai katalog template (dikurangi
  // yang dimatikan lewat Builder → Bingkai) + bingkai unggahan user
  // sendiri di akhir urutan carousel, DENGAN textLayers-nya ditimpa kalau
  // user pernah geser/edit/tambah teks di Builder (eventConfig.
  // frameTextLayers, lihat lib/templates/types.ts). Dihitung di sini
  // (bukan di lib/store.ts) supaya kedua pemanggil EventBooth
  // (app/t/[id], app/e/[id]) otomatis dapat perilaku sama tanpa masing-
  // masing mengulang logikanya.
  const effectiveTemplates =
    eventConfig.disabledFrameIds?.length || eventConfig.customFrames?.length || eventConfig.frameTextLayers
      ? [
          ...templates.filter((t) => !eventConfig.disabledFrameIds?.includes(t.id)),
          ...(eventConfig.customFrames ?? []),
        ].map((t) => {
          const override = eventConfig.frameTextLayers?.[t.id];
          return override ? { ...t, textLayers: override } : t;
        })
      : templates;

  // Kartu video pesan suara (EventTheme.videoTextLayers) numpang di
  // MEKANISME SAMA dengan bingkai (eventConfig.frameTextLayers), kuncinya
  // VIDEO_CARD_FRAME_ID (lihat lib/templates/index.ts & Builder.tsx —
  // "Kartu Video" tampil sebagai bingkai semu ke-4 di situ). Override
  // ditimpakan ke theme.videoTextLayers di sini SEKALI, supaya StepResult
  // (baca event.theme?.videoTextLayers dari store, bukan prop langsung)
  // otomatis dapat versi yang sudah diedit tanpa perlu tahu soal
  // frameTextLayers sama sekali.
  const videoTextOverride = eventConfig.frameTextLayers?.[VIDEO_CARD_FRAME_ID];
  const effectiveEvent =
    videoTextOverride && eventConfig.theme
      ? { ...eventConfig, theme: { ...eventConfig.theme, videoTextLayers: videoTextOverride } }
      : eventConfig;

  useEffect(() => {
    attach(effectiveEvent, readUsed(eventConfig.code), effectiveTemplates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventConfig.id ?? eventConfig.code, attach]);

  // 🐛 Perbaikan bug nyata (ditemukan 2026-08-12, bukan cuma dugaan): font
  // hasil UNDUHAN foto selalu memakai default global (Jakarta/Space Mono
  // dari app/layout.tsx), TIDAK PERNAH ikut font yang dipilih klien di
  // Visual Builder — walau LAYARNYA sudah benar menampilkan font event.
  //
  // Sebabnya: `themeVars(theme)` menaruh `--canvas-display` sebagai style
  // inline di <div> pembungkus di bawah (lihat `return` paling akhir
  // fungsi ini), TAPI lib/compositor.ts (`familyFor()`) dan lib/video.ts
  // membacanya lewat `getComputedStyle(document.documentElement)` — yaitu
  // elemen <html>, BUKAN <div> ini. CSS custom property tidak menjalar ke
  // ATAS; elemen leluhur tidak pernah melihat nilai yang diset di
  // keturunannya. Hasilnya <html> selalu memakai nilai bawaan yang disetel
  // app/layout.tsx, apa pun tema eventnya.
  //
  // Perbaikannya BUKAN membongkar compositor (menaruh parameter root di
  // 8+ titik pemanggilan compose()/renderVoiceCard() berisiko tinggi untuk
  // manfaat yang sama) — cukup naikkan nilainya ke <html> langsung di sini,
  // satu titik, setiap kali tema event berubah. `--canvas-font-<id>` yang
  // dirujuk `canvasFontDisplay` sudah pasti ada di <html> (didaftarkan
  // app/layout.tsx untuk semua 12 font di katalog), jadi override ini
  // aman diresolusi.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const value = event?.theme?.canvasFontDisplay;
    if (value) root.style.setProperty("--canvas-display", value);
    else root.style.removeProperty("--canvas-display");
    return () => {
      root.style.removeProperty("--canvas-display");
    };
  }, [event?.theme?.canvasFontDisplay]);

  if (!event) return null;

  const left = Math.max(0, event.quota - used);
  const ended = event.status === "ended";
  const draft = event.status === "draft";
  const expired = event.status === "expired";
  const theme = event.theme;
  const decorUrl = theme?.decorUrl;
  // Versi kode (SVG) — cuma dipakai kalau TIDAK ada decorUrl (PNG asli
  // selalu menang, lihat komentar EventTheme.decorSvg di types.ts).
  const decorSvg = !decorUrl ? theme?.decorSvg : undefined;
  const brandWatermark = theme?.brandWatermark;
  const hideCatalogLink = theme?.hideCatalogLink ?? false;
  // Dulu cuma dirender di WelcomeScreen (layar sambutan doang) — diminta
  // eksplisit supaya tampil di SEMUA langkah, jadi dipindah ke sini
  // (wrapper bersama tiap step) dan DIHAPUS dari WelcomeScreen supaya
  // tidak dobel di layar itu. Array BOKEH sengaja duplikat kecil
  // (bukan diimpor lintas file) mengikuti pola decorSvg/brandWatermark
  // di atas — satu konstanta 6 baris, belum sepadan dibuat util baru.
  const showBokeh = theme?.effects?.bokeh ?? false;

  const copy = resolveCopy(
    { names: event.names, date: event.date, venue: event.venue, hashtag: event.hashtag },
    event.copy
  );
  const stepLabel: Record<string, string> = {
    bingkai: copy.stepFrame,
    potret: copy.stepShoot,
    suara: copy.stepVoice,
    struk: copy.stepResult,
  };

  const body = !entered ? (
    // WelcomeScreen SENGAJA tidak dibungkus flex-1/justify-center di
    // sini — dia sudah menengahkan isinya SENDIRI lewat min-height +
    // flex internalnya (lihat WelcomeScreen.tsx). Membungkusnya lagi di
    // sini dulu pernah dicoba (centering "ganda"), tapi ketahuan bikin
    // celah atas/bawah jadi TIDAK simetris di device asli (Safari toolbar
    // yang tinggi address bar-nya berubah-ubah bikin dua lapis dvh yang
    // saling menghitung ulang beda hasil) — dilaporkan lewat screenshot
    // Safari sungguhan, bukan cuma dugaan. Satu lapis saja, di dalam
    // WelcomeScreen sendiri, sudah cukup dan terbukti presisi.
    <WelcomeScreen event={event} onEnter={() => setEntered(true)} />
  ) : (
    // Beda dari WelcomeScreen: <main> di bawah TIDAK punya centering
    // sendiri, jadi DIBUNGKUS flex-1 + justify-center di sini — supaya
    // langkah pendek (mis. StepFrame) tetap center, bukan numpuk di atas
    // dengan ruang kosong raksasa di bawah (lihat riwayat perbaikan
    // sebelumnya). min-h-dvh di wrapper PALING LUAR cuma patokan bawah,
    // jadi konten yang lebih tinggi dari layar (mis. StepShoot penuh)
    // tetap aman, tidak terpotong ke atas.
    <div className="flex flex-1 flex-col justify-center">
    <main
      className={`relative z-10 mx-auto w-full max-w-5xl px-4 pt-16 sm:px-8 sm:pt-10 ${
        // Watermark (EventTheme.brandWatermark) sekarang bisa 2 baris di HP
        // sempit (teks lebih panjang, mis. "© 2026 Circle Snap. All rights
        // reserved."), dan posisinya fixed bottom-2 — TIDAK ikut alur dokumen
        // jadi tidak otomatis mendorong konten ke atas. Tanpa padding bawah
        // ekstra, di layar PENDEK (mis. StepVoice) tombol terakhir bisa
        // kelihatan berdempetan dengannya. Cuma nambah padding kalau
        // watermark-nya memang ada — template lain (brandWatermark kosong)
        // tidak berubah sama sekali.
        brandWatermark ? "pb-14 sm:pb-20" : "pb-10 sm:pb-16"
      }`}
    >
      {/* pt-16 di mobile (BUKAN pt-5 seperti sebelumnya) — tautan "Semua
          template" itu `fixed left-3 top-3`, dan header di bawah ini teks
          besar TERSENTER (bukan rata kiri), jadi di layar sempit
          bentangnya gampang menutupi pil itu di pojok kiri atas. sm:pt-10
          tetap seperti semula — di layar lebar pil itu jauh dari tengah,
          tidak ada risiko tabrakan. Ketahuan lewat screenshot viewport HP
          asli (390px), bukan cuma dugaan. */}
      {/* Sisa kuota sengaja tidak ditampilkan ke tamu — itu informasi
          per-event untuk panitia/admin (nanti bagian model langganan),
          bukan sesuatu yang perlu dipantau tamu selama sesi foto.
          Header: sapaan besar (event.brandLabel, default "Happy Wedding"
          — event non-wedding mis. lamaran isi sendiri) jadi sapaan utama,
          nama acara di bawahnya, lalu label sesi kecil — semuanya center,
          dipakai sama di keempat langkah (bingkai/potret/suara/struk). */}
      <header className="mb-6 text-center">
        <p className="text-brand-gradient font-display text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {event.brandLabel ?? "Happy Wedding"}
        </p>
        <h1 className="mt-1.5 truncate font-display text-lg leading-tight tracking-tight text-smoke sm:text-xl">
          {event.names}
        </h1>
        <span className="tracked mt-3 inline-block rounded-full px-3 py-1 font-mono text-[10px] text-smoke ring-1 ring-edge">
          {stepLabel[step]}
        </span>
      </header>

      {(left === 0 || ended || draft || expired) && step !== "struk" ? (
        <section className="rounded-2xl p-8 text-center ring-1 ring-edge">
          <h2 className="font-display text-xl">
            {draft
              ? "Acara ini belum dipublikasikan"
              : expired
                ? "Masa aktif acara ini sudah habis"
                : ended
                  ? "Acara ini sudah selesai"
                  : copy.quotaExhaustedTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-smoke">
            {draft
              ? "Panitia masih menyiapkan acara ini. Coba pindai ulang QR kalau sudah waktunya acara dimulai."
              : expired
                ? "Paket 7 hari untuk acara ini sudah lewat masanya. Foto & video yang sudah ada masih tersimpan — hubungi panitia untuk membuka aksesnya kembali."
                : ended
                  ? "Sesi foto baru untuk acara ini sudah ditutup."
                  : copy.quotaExhaustedBody}
          </p>
        </section>
      ) : (
        <>
          {step === "bingkai" && <StepFrame />}
          {step === "potret" && <StepShoot />}
          {step === "suara" && <StepVoice />}
          {step === "struk" && <StepResult />}
        </>
      )}
    </main>
    </div>
  );

  if (!theme) return body;

  // Bentuk tombol diatur per template (theme.elements.buttonShape) dan
  // berlaku untuk SEMUA layar sekaligus — dikirim sebagai satu CSS var
  // supaya tiap tombol lebar (kelas .btn-shape) ikut tanpa harus dioper
  // prop berlapis. Tombol bundar seperti shutter kamera sengaja TIDAK
  // memakai kelas itu: mengotakkan shutter bukan pilihan gaya, itu kerusakan.
  const btnRadius =
    theme.elements?.buttonShape === "square"
      ? "8px"
      : theme.elements?.buttonShape === "rounded"
        ? "18px"
        : theme.elements?.buttonShape === "arch"
          ? "32px 32px 10px 10px"
          : "9999px";

  return (
    <div
      // flex flex-col — BARU (dulu cuma "relative min-h-dvh bg-ink"),
      // supaya {body} bisa jadi flex item yang mengatur tinggi/centering-
      // nya SENDIRI (WelcomeScreen pakai min-height+flex internal;
      // wrapper <main> di atas pakai flex-1+justify-center). `justify-
      // center` SENGAJA TIDAK diletakkan di sini (pernah dicoba, lihat
      // riwayat) — kalau dipasang di wrapper terluar ini, dia ikut
      // menengahkan WelcomeScreen sebagai SATU BLOK di atas centering
      // internalnya sendiri, dua lapis dvh yang saling menghitung ulang
      // beda hasil di device asli (Safari address bar) → celah atas/
      // bawah jadi tidak simetris, dilaporkan lewat screenshot Safari
      // sungguhan. Cukup satu lapis centering per jenis konten, bukan
      // ditumpuk dari wrapper ini.
      className="relative flex min-h-dvh flex-col bg-ink"
      style={{
        ...themeVars(theme),
        "--booth-btn-radius": btnRadius,
        // Tekstur titik-titik (EventTheme.dotPattern, lihat types.ts) —
        // backgroundImage SENGAJA (bukan div terpisah), supaya otomatis
        // melukis DI BAWAH semua konten anak elemen ini tanpa perlu
        // atur z-index sendiri (foto sambutan WelcomeScreen dkk yang
        // punya latar sendiri otomatis menimpanya, tidak perlu logika
        // tambahan). color-mix supaya opacity-nya rendah TANPA
        // menghitung rgba manual dari hex tema (--color-flash beda-beda
        // tiap template).
        ...(theme.dotPattern
          ? {
              backgroundImage:
                "radial-gradient(circle, color-mix(in srgb, var(--color-flash) 35%, transparent) 1px, transparent 1.5px)",
              backgroundSize: "26px 26px",
            }
          : {}),
      } as React.CSSProperties}
    >
      {/* Playground berisi banyak template (lib/templates/index.ts) — tautan
          ini satu-satunya jalan balik ke katalog dari dalam sesi, jadi tamu
          yang salah pilih atau cuma mau lihat-lihat tidak terjebak. z-20:
          di atas dekorasi sudut (z-0) dan konten (z-10).
          Disembunyikan kalau theme.hideCatalogLink true (mis. wedding.ts di
          repo deploy khusus acara — root "/" redirect langsung ke template
          itu, tautan ini jadi mubazir/klik-nya cuma redirect balik ke
          template yang sama). Kosong/false = tampil seperti biasa. */}
      {!hideCatalogLink && (
        <Link
          href="/"
          className="fixed left-3 top-3 z-20 rounded-full bg-ink/70 px-3 py-1.5 font-mono text-[10px] text-smoke ring-1 ring-edge backdrop-blur transition hover:text-paper sm:left-4 sm:top-4"
        >
          ← Semua template
        </Link>
      )}
      {decorUrl && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
          {/* Bunga sudut dipakai ulang dari aset bingkai — satu gambar,
              dipantulkan/diputar lewat CSS ke keempat sudut, jadi tema
              terasa konsisten dari selamat datang sampai struk. Sekarang
              tetap tampil di keempat sisi sepanjang sesi (bukan cuma sudut
              bawah setelah masuk) — header sudah cukup ringkas untuk
              berbagi ruang dengan sudut atas.

              z-10 (BUKAN z-0 seperti sebelumnya) — foto sambutan latar
              penuh (WelcomeScreen.tsx, mode "cover") ada di div SAUDARA
              elemen ini (bukan turunannya), sama-sama render di dalam
              wrapper EventBooth ini. Dua elemen z-0 yang bersaudara
              begitu urutan tampilnya ditentukan urutan DOM, dan foto itu
              muncul BELAKANGAN (di dalam {"{body}"} di bawah) — jadi
              menimpa dekorasi ini walau z-index-nya sama. Dinaikkan ke
              z-10 supaya PASTI di atas foto apa pun urutan DOM-nya —
              posisinya di sudut jadi kecil kemungkinan menimpa teks
              tengah yang juga z-10. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={decorUrl}
            alt=""
            className="absolute left-0 top-0 w-24 opacity-80 sm:w-36"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={decorUrl}
            alt=""
            className="absolute right-0 top-0 w-24 -scale-x-100 opacity-80 sm:w-36"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={decorUrl}
            alt=""
            className="absolute bottom-0 left-0 w-24 -scale-y-100 opacity-70 sm:w-36"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={decorUrl}
            alt=""
            className="absolute bottom-0 right-0 w-24 -scale-x-100 -scale-y-100 opacity-70 sm:w-36"
          />
        </div>
      )}
      {/* Versi kode (SVG) — template tanpa PNG dekorasi sama sekali
          (wedding.ts dkk, lihat EventTheme.decorSvg di types.ts). Pola
          pantulan 4 sudut SAMA PERSIS dengan blok decorUrl di atas, cuma
          gambarnya diganti <CornerOrnament>. Warna ikut currentColor →
          diset lewat style di pembungkus (var(--color-flash), aksen
          tema, konsisten dengan warna GOLD/MUTED_GOLD dst yang dipakai
          ornament() bingkainya sendiri). */}
      {decorSvg && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
          style={{ color: "var(--color-flash)" }}
        >
          <div className="absolute left-0 top-0 opacity-80">
            <CornerOrnament variant={decorSvg} />
          </div>
          <div className="absolute right-0 top-0 -scale-x-100 opacity-80">
            <CornerOrnament variant={decorSvg} />
          </div>
          <div className="absolute bottom-0 left-0 -scale-y-100 opacity-70">
            <CornerOrnament variant={decorSvg} />
          </div>
          <div className="absolute bottom-0 right-0 -scale-x-100 -scale-y-100 opacity-70">
            <CornerOrnament variant={decorSvg} />
          </div>
        </div>
      )}
      {/* Watermark "by Circle Snap" — diminta eksplisit KHUSUS template
          hasil order client sungguhan (EventTheme.brandWatermark, lihat
          types.ts), kosong = tidak render apa pun, template lain tidak
          berubah. z-20 (sama dengan tautan "Semua template") supaya
          selalu di atas dekorasi sudut & konten; pointer-events-none
          supaya tidak pernah mencegat tap tombol shutter/dsb di
          bawahnya walau posisinya dekat. Tampil di SEMUA langkah karena
          ditaruh di wrapper ini, bukan di salah satu Step. */}
      {showBokeh && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
          {BOKEH.map((b, i) => (
            <span
              key={`bokeh-${i}`}
              className="bokeh"
              style={{
                left: b.left,
                width: b.size,
                height: b.size,
                background: b.color,
                opacity: b.opacity,
                animationDuration: b.duration,
                animationDelay: b.delay,
              }}
            />
          ))}
        </div>
      )}
      {brandWatermark && (
        <p
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-1.5 z-20 mx-auto w-fit max-w-[92vw] rounded-full bg-ink/40 px-3 py-1 text-center font-mono text-[9px] leading-snug tracking-wide text-smoke/70 backdrop-blur-sm"
        >
          {brandWatermark}
        </p>
      )}
      {body}
    </div>
  );
}
