"use client";

import { useState } from "react";
import type { EventConfig } from "@/lib/templates";
import { resolveCopy } from "@/lib/copy";
import { useSession } from "@/lib/store";
import { Images } from "./icons";
import MomentsGallery from "./MomentsGallery";

/** Inisial dari "Salma & Faizal" -> "S · F". Dipakai di monogram. */
function initials(names: string): string {
  return names
    .split("&")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join(" · ");
}

/** Kelopak bunga yang jatuh mengambang — posisi, ukuran, warna, dan waktu
    sengaja dibuat beda-beda per kelopak supaya gerakannya terasa organik,
    bukan berbaris rapi. */
const PETALS = [
  { left: "6%", size: 12, color: "var(--color-flash)", duration: "9s", delay: "0s" },
  { left: "18%", size: 9, color: "var(--color-brand-gold)", duration: "12s", delay: "2.5s" },
  { left: "34%", size: 15, color: "var(--color-flash)", duration: "8.5s", delay: "5s" },
  { left: "52%", size: 10, color: "var(--color-brand-purple)", duration: "11s", delay: "1s" },
  { left: "68%", size: 13, color: "var(--color-brand-gold)", duration: "10s", delay: "3.5s" },
  { left: "82%", size: 9, color: "var(--color-flash)", duration: "13s", delay: "6s" },
  { left: "92%", size: 12, color: "var(--color-brand-purple)", duration: "9.5s", delay: "4s" },
];

/** Kilau — bintik berdenyut (lihat .sparkle di globals.css). */
const SPARKLES = [
  { left: "12%", top: "18%", size: 5, duration: "3.2s", delay: "0s" },
  { left: "28%", top: "62%", size: 3, duration: "4.1s", delay: "1.2s" },
  { left: "41%", top: "12%", size: 4, duration: "3.6s", delay: "2.4s" },
  { left: "58%", top: "78%", size: 5, duration: "4.6s", delay: "0.6s" },
  { left: "71%", top: "28%", size: 3, duration: "3.9s", delay: "3s" },
  { left: "86%", top: "58%", size: 4, duration: "4.3s", delay: "1.8s" },
  { left: "19%", top: "86%", size: 3, duration: "3.4s", delay: "2.8s" },
  { left: "94%", top: "14%", size: 4, duration: "4.8s", delay: "0.9s" },
];

export default function WelcomeScreen({
  event,
  onEnter,
}: {
  event: EventConfig;
  onEnter: () => void;
}) {
  const [momentsOpen, setMomentsOpen] = useState(false);
  const { guestName, setGuestName, guestNameRequired } = useSession();
  const canEnter = !guestNameRequired || guestName.trim().length > 0;
  const copy = resolveCopy({ names: event.names, date: event.date, venue: event.venue, hashtag: event.hashtag }, event.copy);
  // Kicker di layar sambutan disamakan dengan sapaan besar di header sesi
  // (event.brandLabel, EventBooth.tsx) — dulu dua string lepas ("Virtual
  // Photobooth" vs "Happy Wedding") yang gampang tidak sinkron. Sekarang
  // satu sumber: isi brandLabel lewat Builder, otomatis ikut di sini juga.
  const kickerText = event.brandLabel?.trim() || copy.welcomeKicker;
  // "display" = pakai font judul, ukuran lebih besar — lihat
  // ThemeElements.kickerFont di lib/templates/types.ts. Default "mono"
  // (perilaku lama) supaya template lain tidak ikut berubah. Warnanya
  // dipisah dari sini (bukan digabung di kickerFontClass) karena beda
  // konteks: di atas foto (mode banner) selalu text-ink biar senada
  // dengan judul di sana. Di halaman polos, kicker display SENGAJA pakai
  // text-paper (sama persis warna nama), BUKAN text-flash (aksen) —
  // permintaan eksplisit: "Happy Engagement" harus senada dengan "Salma &
  // Faizal" di bawahnya, bukan warna beda sendiri.
  const kickerIsDisplay = event.theme?.elements?.kickerFont === "display";
  const kickerFontClass = kickerIsDisplay ? "font-display text-2xl tracking-tight" : "tracked font-mono text-[11px]";
  // Bisa dimatikan per template (session.moments.enabled) — lihat catatan
  // di lib/moments.ts soal galeri ini sebenarnya per-PERANGKAT, bukan
  // benar-benar dibagi lintas tamu, karena playground ini tanpa backend.
  const momentsEnabled = event.session?.moments?.enabled ?? true;

  const el = event.theme?.elements;
  const mono = {
    mode: el?.monogram?.mode ?? "initials",
    url: el?.monogram?.url,
    size: el?.monogram?.size ?? 64,
    ring: el?.monogram?.ring ?? true,
  };
  // Foto besar layar sambutan (peran foto pasangan di undangan digital).
  // Default "hidden" — playground sebelum fitur ini tidak punya slot foto
  // sama sekali, event lama tidak boleh tiba-tiba menampilkan kotak kosong.
  // Mode apa pun diabaikan kalau fotonya belum diunggah (url kosong).
  const hero = {
    mode: el?.heroPhoto?.url ? (el.heroPhoto.mode ?? "hidden") : "hidden",
    url: el?.heroPhoto?.url,
    size: el?.heroPhoto?.size ?? 160,
    overlay: Math.max(0, Math.min(90, el?.heroPhoto?.overlay ?? 45)),
    zoom: Math.max(1, Math.min(3, el?.heroPhoto?.zoom ?? 1)),
    posX: Math.max(0, Math.min(100, el?.heroPhoto?.posX ?? 50)),
    posY: Math.max(0, Math.min(100, el?.heroPhoto?.posY ?? 50)),
  };
  // object-position DAN transform-origin dipasang bareng, nilai sama —
  // supaya zoom (scale) memusat di titik fokus yang sama dengan geseran
  // object-position, bukan selalu dari tengah/sudut kanvas. Dipakai di
  // KEDUA mode foto (cover & banner) yang sama-sama object-cover.
  const heroImgStyle: React.CSSProperties = {
    objectPosition: `${hero.posX}% ${hero.posY}%`,
    transform: `scale(${hero.zoom})`,
    transformOrigin: `${hero.posX}% ${hero.posY}%`,
  };

  // Bentuk tombol: "pill" = rounded-full (perilaku lama). String (bukan
  // angka) supaya "arch" bisa kirim 4 nilai sekaligus (melengkung penuh
  // di atas, rata di bawah) — React tetap terima angka polos untuk
  // borderRadius, tapi shorthand 4-nilai wajib string.
  const btnRadius =
    el?.buttonShape === "square"
      ? "8px"
      : el?.buttonShape === "rounded"
        ? "18px"
        : el?.buttonShape === "arch"
          ? "32px 32px 10px 10px"
          : "9999px";

  // Undefined = perilaku lama (semua nyala) — event yang belum pernah
  // menyimpan `theme.effects` (termasuk EVENTS hardcode di lib/event.ts)
  // tidak boleh berubah tampilannya sama sekali. Lihat docs/blueprint/
  // 05-peta-jalan.md Fase 2 "toggle efek".
  const effects = event.theme?.effects;
  const showBlobs = effects?.blobs ?? true;
  const showPetals = effects?.petals.enabled ?? true;
  const petalCount = Math.max(0, Math.min(effects?.petals.count ?? PETALS.length, PETALS.length));
  const visiblePetals = PETALS.slice(0, petalCount);
  // Efek BARU (2026-08-12) default MATI, bukan menyala seperti dua di
  // atas — event yang sudah berjalan tidak boleh tiba-tiba dapat animasi
  // yang tidak pernah dipilih panitianya.
  // (bokeh dipindah ke EventBooth.tsx supaya tampil di SEMUA langkah,
  // bukan cuma di layar ini — lihat komentar di sana.)
  const showSparkle = effects?.sparkle ?? false;

  // Kicker/judul/tanggal PINDAH ke dalam foto banner (bukan lagi di bawah
  // gradasinya) — permintaan eksplisit: teks itu jadi bagian dari foto,
  // warnanya ikut `--color-ink` (warna dasar terang tema ini) supaya
  // kebaca di atas foto, bukan dark `text-paper` bawaan. Mode lain
  // (hidden/circle/cover) tidak berubah, tetap dark text di bawah foto.
  const heroBannerActive = hero.mode === "banner" && !!hero.url;

  return (
    // min-h-dvh (BUKAN calc(100dvh-3rem) seperti sebelumnya) — sisa "-3rem"
    // itu peninggalan lama yang sudah tidak match apa pun di struktur
    // EventBooth.tsx sekarang (Link & dekorasi sudut sama-sama
    // position:fixed, tidak makan ruang flow). Efeknya: WelcomeScreen
    // selalu 48px LEBIH PENDEK dari wrapper EventBooth di luarnya, dan
    // sisa 48px itu selalu jatuh di BAWAH saja (bukan simetris di dua
    // sisi) — persis "atas bawahnya tidak simetris" yang dilaporkan di
    // Safari sungguhan. min-h-dvh menyamakan tinggi WelcomeScreen dengan
    // wrapper luarnya persis, jadi tidak ada sisa yang perlu disimetriskan
    // sama sekali.
    <div className="relative flex min-h-dvh flex-col overflow-hidden text-center">
      {/* Foto latar penuh (mode "cover") — digambar PALING BAWAH, sebelum
          efek ambien, supaya kelopak dkk tetap melayang DI ATAS foto
          (bokeh sendiri sudah dirender EventBooth.tsx, DI LUAR komponen
          ini, jadi otomatis di atas foto ini juga).
          Lapisan gelap di atasnya wajib: tanpa itu teks putih di atas foto
          terang jadi tidak terbaca sama sekali. Absolute inset-0 di sini
          tetap tembus tepi meski div pembungkus sudah tidak punya px-6/
          py-16 sendiri (dipindah ke wrapper konten di bawah) — perilaku
          "inset-0 ikut padding-box, bukan content-box" tidak berubah. */}
      {hero.mode === "cover" && hero.url && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- foto unggahan klien, bukan aset build */}
          <img src={hero.url} alt="" className="h-full w-full object-cover" style={heroImgStyle} />
          {/* 🐛 Perbaikan bug nyata: dulu cuma 2 titik warna (transparan di
              0%, gelap `overlay`% di 40%) TANPA titik lanjutan — CSS
              linear-gradient otomatis merambatkan warna PALING AKHIR ke
              SISA area (40%-100%), jadi separuh bawah foto jadi SOLID gelap
              rata, bukan gradasi landai seperti niatnya. Foto sambutan jadi
              nyaris tidak kelihatan sama sekali di bawah 40% (dilaporkan
              lewat screenshot wedding.ts — foto pasangan nyaris hitam
              polos), bukan cuma "kurang landai". Kena SEMUA template
              heroPhoto mode "cover" (wedding.ts & lamaran.ts sama-sama
              overlay:90), bukan cuma satu template.
              Diperbaiki jadi TIGA titik: transparan di atas, wash SEDANG
              (setengah dari `overlay`) di tengah supaya foto tetap terlihat
              di badan gambar, baru wash PENUH (`overlay`) di 75% — dekat ke
              zona teks/tombol di bawah, bukan lagi mulai gelap total sejak
              40%. */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--color-ink) ${hero.overlay / 2}%, transparent) 42%, color-mix(in srgb, var(--color-ink) ${hero.overlay}%, transparent) 75%)`,
            }}
          />
        </div>
      )}

      {/* Cahaya ambien yang mengambang pelan — cuma di layar selamat datang,
          supaya kesan pertama terasa hidup sebelum tamu masuk ke sesi
          fungsional. Warnanya ikut tema event lewat CSS variable yang
          sama dipakai brand-gradient, jadi otomatis menyesuaikan tiap
          acara tanpa kode tambahan. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {showBlobs && (
          <>
            <div className="blob floating -left-16 -top-16 h-64 w-64 bg-brand-purple" />
            <div className="blob floating-slow -right-14 top-1/3 h-56 w-56 bg-flash" />
            <div className="blob floating bottom-[-4rem] left-1/4 h-52 w-52 bg-brand-gold" />
          </>
        )}
        {showPetals &&
          visiblePetals.map((p, i) => (
            <span
              key={i}
              className="petal"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                background: p.color,
                animationDuration: p.duration,
                animationDelay: p.delay,
              }}
            />
          ))}
        {showSparkle &&
          SPARKLES.map((s, i) => (
            <span
              key={`sparkle-${i}`}
              className="sparkle"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                background: "var(--color-flash)",
                boxShadow: "0 0 6px var(--color-flash)",
                animationDuration: s.duration,
                animationDelay: s.delay,
              }}
            />
          ))}
      </div>

      {/* Pita foto (mode "banner") — DI ALUR DOKUMEN (bukan absolute lagi),
          tembus tepi kiri-kanan-atas lewat negative margin yang menembus
          px-6/py-16 milik wrapper konten di bawahnya (bukan milik div ini
          sendiri — div ini sengaja TIDAK punya padding jadi tidak perlu
          negative margin sama sekali, cukup w-full). Kicker/judul/tanggal
          sekarang ikut MASUK ke dalam kotak ini, ditempel di dasarnya
          (justify-end) tepat di zona gradasi yang sudah menggelap —
          bukan lagi elemen terpisah di bawah foto. */}
      {heroBannerActive && (
        <div className="relative z-10 w-full flex-none overflow-hidden" style={{ height: "50dvh" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- foto unggahan klien, bukan aset build */}
          <img src={hero.url} alt="" className="absolute inset-0 h-full w-full object-cover" style={heroImgStyle} />
          {/* `mask-image` (dipakai sebelumnya) itu operasi COMPOSITING —
              browser merender lapisan ini lalu MENIMPAKAN mask-nya sebagai
              pass terpisah. Di Builder, pratinjau device mockup men-scale
              seluruh iframe ini lewat `transform: scale()` (lihat
              builder-mockup di Builder.tsx) — mask yang di-composite lalu
              di-scale-down begitu gampang menyisakan garis rambut di
              batas solid/transparannya (rasterisasi native lalu diperkecil,
              beda dengan gambar biasa yang cuma "difoto"). Diganti jadi
              `background` linear-gradient biasa — itu operasi PAINT
              langsung, ikut discale bareng kontennya, jadi tidak ada pass
              compositing terpisah yang bisa menyisakan seam.

              DUA warna beda peran, BUKAN satu var(--color-ink) diulang:
              zona atas (0-45%) menggelap ke `--color-paper` — warna
              KONTRAS tema ini (gelap di Botanical, terang di tema gelap
              macam Night Fest), supaya teks `text-ink` di atasnya selalu
              cukup kontras APAPUN temanya. Baru di 55% SISANYA (45%-100%,
              BUKAN cuma 22% seperti sebelumnya) lanjut landai ke
              `--color-ink` (warna latar HALAMAN) — zona pudarnya sengaja
              dilebarkan jauh: lompatan warnanya (gelap pekat → cream)
              besar, jadi kalau jaraknya pendek tetap KELIHATAN seperti
              garis walau gradasinya benar secara hitungan (persis keluhan
              user — sudah diverifikasi visual, bukan cuma teori). */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--color-paper) ${hero.overlay}%, transparent) 40%, color-mix(in srgb, var(--color-paper) ${hero.overlay}%, transparent) 45%, var(--color-ink) 100%)`,
            }}
          />
          {/* Kicker/judul/tanggal DI DALAM foto — ditempel 55% dari dasar
              kotak (BUKAN nempel pas di tepi bawah) supaya selalu jatuh di
              zona gelap `--color-paper` di atas (0-45%), bukan di zona
              pudar-ke-latar yang sekarang jauh lebih lebar. text-ink =
              warna dasar/cream template ini, kontras terhadap wash gelap
              di atas. */}
          <div className="absolute inset-x-0 flex flex-col items-center px-6" style={{ bottom: "55%" }}>
            <p className={`${kickerFontClass} text-ink`}>{kickerText}</p>
            <h1 className="mt-3 max-w-xs font-display text-4xl leading-tight tracking-tight text-ink">
              {event.names}
            </h1>
            <p className="mt-3 font-mono text-[12px] leading-relaxed text-ink/80">{event.date}</p>
          </div>
        </div>
      )}

      {/* Wrapper konten: px-6/py-16 + center vertikal PINDAH ke sini
          (dulu di div terluar) — supaya pita banner di atas bisa tembus
          tepi tanpa negative-margin hack. Kalau tidak ada banner, wrapper
          ini mengisi tinggi penuh & menengahkan isinya persis seperti
          perilaku lama. Kalau ada banner, wrapper ini `flex-1` mengisi
          SISA tinggi di bawah pita foto & menengahkan isinya di situ. */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="step-enter flex flex-col items-center">
        {/* Foto bulat (mode "circle") — menggantikan posisi monogram
            sebagai elemen utama. Monogram di bawah sengaja TIDAK ikut
            disembunyikan otomatis: klien boleh memakai keduanya (foto
            besar + inisial kecil) kalau memang mau, itu keputusan
            tampilan, bukan aturan sistem. */}
        {hero.mode === "circle" && hero.url && (
          <div
            className="mb-6 overflow-hidden rounded-full ring-1 ring-edge"
            style={{ width: hero.size, height: hero.size }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- foto unggahan klien */}
            <img src={hero.url} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        {/* Monogram — bisa diatur klien lewat Visual Builder (sesi
            Selamat Datang): inisial otomatis, logo unggahan sendiri, atau
            disembunyikan. Default `initials` + ring + 64px = persis
            perilaku lama, jadi event yang datanya belum punya
            theme.elements tidak berubah sedikit pun. */}
        {mono.mode !== "hidden" && (
          <div
            className={`grid place-items-center overflow-hidden rounded-full ${mono.ring ? "ring-1 ring-edge" : ""}`}
            style={{ width: mono.size, height: mono.size }}
          >
            {mono.mode === "image" && mono.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- aset klien, ukuran kecil
              <img src={mono.url} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="font-display text-lg tracking-wide text-flash">
                {initials(event.names)}
              </span>
            )}
          </div>
        )}

        {/* Kicker/judul/tanggal di sini HANYA kalau tidak sudah tampil di
            dalam pita banner di atas — mode lain (hidden/circle/cover)
            tetap seperti semula, dark text di halaman polos/foto latar. */}
        {!heroBannerActive && (
          <>
            <p className={`${kickerFontClass} mt-7 ${kickerIsDisplay ? "text-paper" : "text-smoke"}`}>{kickerText}</p>
            <h1 className="mt-3 max-w-xs font-display text-4xl leading-tight tracking-tight text-paper">
              {event.names}
            </h1>
            <p className="mt-4 font-mono text-[12px] leading-relaxed text-smoke">{event.date}</p>
          </>
        )}

        <p className="mt-8 max-w-xs text-[14px] leading-relaxed text-smoke">
          {event.greeting}
        </p>

        {/* Nama tamu diminta di sini, bukan di step terpisah — supaya
            pengantin nanti tahu tiap foto/pesan suara di galeri Momen itu
            dari siapa. Tombol "Mulai sesi foto" sengaja baru MUNCUL setelah
            nama diisi (bukan sekadar disabled), jadi jelas ini langkah yang
            diminta, bukan field opsional yang gampang dilewati. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canEnter) onEnter();
          }}
          className="mt-8 w-full max-w-[240px]"
        >
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder={copy.guestNamePlaceholder}
            maxLength={40}
            // "off" (bukan "name") — fix CSS autofill di globals.css
            // (box-shadow inset warna --color-ink) cuma cocok buat tema
            // LATAR POLOS. Tema dengan foto sambutan penuh layar (mis.
            // Botanical, heroPhoto mode "cover") jadi kelihatan kotak
            // tambal solid nempel di atas foto begitu browser meng-
            // autofill field ini dari nama tersimpan sebelumnya — matikan
            // ajakannya di akar, bukan coba cocokkan warna tambalan ke
            // background foto yang mustahil (box-shadow tidak bisa
            // menggambar foto).
            autoComplete="off"
            className="name-input w-full border-b border-edge bg-transparent px-1 pb-2 text-center font-display text-lg tracking-tight text-paper placeholder:text-smoke/60 focus:border-flash focus:outline-none"
          />

          {canEnter && (
            <button
              type="submit"
              className="frame-slide-in btn-primary mt-6 w-full py-4 font-display text-base tracking-tight text-ink"
              style={{ borderRadius: btnRadius }}
            >
              {copy.welcomeCta}
            </button>
          )}
        </form>

        {/* Ajakan lihat momen SEBELUM mulai sesi sendiri — supaya calon
            tamu bisa lihat contoh hasilnya dulu. Tidak butuh nama diisi. */}
        {momentsEnabled && (
          <button
            onClick={() => setMomentsOpen(true)}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 font-mono text-[11px] text-smoke ring-1 ring-edge transition hover:text-paper ${canEnter ? "mt-4" : "mt-6"}`}
            style={{ borderRadius: btnRadius }}
          >
            <Images className="h-3.5 w-3.5" />
            {copy.welcomeMomentsCta}
          </button>
        )}
      </div>
      </div>

      {momentsOpen && momentsEnabled && (
        <MomentsGallery event={event} onClose={() => setMomentsOpen(false)} />
      )}
    </div>
  );
}
