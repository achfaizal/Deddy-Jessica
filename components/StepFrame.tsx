"use client";

import { useState } from "react";
import { tokensFor } from "@/lib/templates";
import { useSession } from "@/lib/store";
import { ChevronLeft, ChevronRight } from "./icons";

export default function StepFrame() {
  const { event, templates, chooseTemplate } = useSession();
  const [index, setIndex] = useState(0);

  if (!event) return null;

  // `templates` sudah persis daftar bingkai template ini, dalam urutan
  // carousel yang benar — diisi attach() dari PlaygroundTemplate.frames.
  // Lihat lib/store.ts.
  const allowed = templates;
  const tokens = tokensFor(event);
  const active = allowed[index];

  // Muter melingkar — cuma ada 2-3 pilihan per event, jadi "next" dari yang
  // terakhir wajar balik ke yang pertama, bukan tombol mati.
  const prev = () => setIndex((i) => (i - 1 + allowed.length) % allowed.length);
  const next = () => setIndex((i) => (i + 1) % allowed.length);

  if (!active) return null;

  return (
    <section className="step-enter mx-auto max-w-md">
      <div className="flex items-center gap-3">
        {allowed.length > 1 && (
          <button
            onClick={prev}
            aria-label="Bingkai sebelumnya"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-smoke ring-1 ring-edge transition hover:text-paper hover:ring-flash"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <button
            key={active.id}
            onClick={() => chooseTemplate(active)}
            className="frame-slide-in group flex w-full justify-center text-left focus-visible:outline-none"
          >
            {/* Ukuran kotak ditentukan oleh <img> itu sendiri lewat
                max-height/max-width + auto (perilaku bawaan elemen replaced,
                konsisten di semua browser) — bukan lewat aspect-ratio pada
                div pembungkus, yang lebarnya tidak ikut menyusut di
                Safari/WebKit saat max-height kena batas. Pembungkus dibuat
                inline-block supaya menyusut mengikuti ukuran img. */}
            <div className="relative inline-block overflow-hidden rounded-2xl ring-1 ring-edge transition group-hover:ring-flash group-focus-visible:ring-flash">
              {/* Arsir menandai lubang tempat foto akan jatuh. */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, #2E2658 0 6px, #1E1B4B 6px 12px)",
                }}
              />
              {/* max-h dinaikkan dari 30dvh — bingkai berasio sangat ramping
                  (mis. wedding.ts, ~0.41-0.56 lebar/tinggi) jadi kebatas oleh
                  TINGGI duluan di HP, hasilnya preview selebar ~90-120px,
                  detail ornamennya nyaris tidak kelihatan. 38dvh masih aman
                  di layar pendek (field info + tombol "Pilih bingkai ini" +
                  dots di bawahnya tetap muat tanpa scroll di viewport 390×
                  ~700px yang jadi patokan booth ini) dan berlaku untuk semua
                  template, bukan cuma yang rasionya ekstrem. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.overlay}
                alt=""
                className="relative block max-h-[38dvh] max-w-[280px] h-auto w-auto object-contain"
              />
            </div>
          </button>
        </div>

        {allowed.length > 1 && (
          <button
            onClick={next}
            aria-label="Bingkai berikutnya"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-smoke ring-1 ring-edge transition hover:text-paper hover:ring-flash"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      <div key={`${active.id}-info`} className="frame-slide-in mt-3 text-center">
        {/* text-paper WAJIB — tanpa ini h3 mewarisi `color` dari <body>
            (globals.css), yang nilainya warna tema GLOBAL (bukan tema
            event aktif, itu cuma CSS variable di wrapper EventBooth,
            tidak ikut ke body). Di tema terang macam Botanical itu jadi
            cream-di-atas-cream, nyaris tidak kelihatan — baru ketahuan
            sekarang karena teks lain di sekitarnya baru saja dihapus. */}
        <h3 className="font-display text-base leading-tight tracking-tight text-paper">{active.name}</h3>
      </div>

      {allowed.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {allowed.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setIndex(i)}
              aria-label={`Lihat bingkai ${t.name}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 brand-gradient" : "w-1.5 bg-edge"
              }`}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => chooseTemplate(active)}
        className="btn-primary btn-shape mt-4 w-full rounded-full py-3.5 font-display text-base tracking-tight text-ink"
      >
        Pilih bingkai ini
      </button>

      {allowed.some((t) => t.textLayers.length > 0) && (
        <p className="mt-4 rounded-2xl p-3 text-center font-mono text-[11px] leading-relaxed text-smoke ring-1 ring-edge">
          Nama <span className="text-paper">{tokens.names}</span> dan tanggalnya
          dicetak otomatis di setiap bingkai. Tidak ada file terpisah per acara —
          satu bingkai melayani semua event.
        </p>
      )}
    </section>
  );
}
