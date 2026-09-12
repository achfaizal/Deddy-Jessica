"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PLAYGROUND_TEMPLATES, getTemplate } from "@/lib/templates";
import { ChevronRight, Eye, X } from "@/components/icons";

/** Ukuran mockup HP di kartu katalog — SENGAJA konstanta terpisah dari
    MOCKUP_* di components/dashboard/Builder.tsx (beda konteks: itu panel
    editor 1 bingkai, ini kartu grid banyak template sekaligus, perlu lebih
    kecil supaya beberapa muat sebaris). Konten asli EventBooth 375×800
    di-scale-down ke sini, bukan versi mini terpisah, sama seperti pola di
    Builder — supaya pratinjau akurat 100%, bukan cuma ilustrasi. */
const CARD_MOCKUP_W = 200;
const CARD_MOCKUP_H = 400;
const CARD_MOCKUP_PADDING = 7;
const CARD_INNER_W = CARD_MOCKUP_W - CARD_MOCKUP_PADDING * 2;
const CARD_INNER_H = CARD_MOCKUP_H - CARD_MOCKUP_PADDING * 2;

/** Mockup HP di modal Preview — lebih besar dari punya kartu (supaya enak
    diklik-klik sungguhan) dan pointer events-nya AKTIF (kartu di grid
    sengaja pointerEvents "none", cuma ilustrasi). */
const MODAL_MOCKUP_W = 300;
const MODAL_MOCKUP_H = 620;
const MODAL_MOCKUP_PADDING = 10;
const MODAL_INNER_W = MODAL_MOCKUP_W - MODAL_MOCKUP_PADDING * 2;
const MODAL_INNER_H = MODAL_MOCKUP_H - MODAL_MOCKUP_PADDING * 2;

/**
 * Pilih template (§11.4-ish, tapi kartu bukan tabel — 5 item cukup
 * sedikit untuk grid, tabel baru masuk akal kalau katalog sudah puluhan).
 *
 * Tiap kartu mockup HP berisi pratinjau HIDUP layar Selamat Datang
 * template itu (lewat <iframe src="/t/[id]">, PAKAI bingkai & event
 * bawaan template APA ADANYA — bukan hasil edit siapa pun, beda dari
 * /preview yang khusus Builder baca draft localStorage) — supaya user
 * langsung lihat gambaran templatenya sebelum memutuskan.
 *
 * Dua aksi terpisah per kartu:
 * - "Preview" → BUKAN tab baru — buka modal berbentuk mockup HP juga
 *   (lebih besar & interaktif) di halaman yang sama, supaya "coba
 *   playground dulu sebelum edit" terasa menyatu, tidak lompat keluar
 *   dashboard. Isinya `/t/[id]` sungguhan, bisa diklik-klik (Mulai,
 *   pilih bingkai, foto) pakai bingkai bawaan, bukan custom.
 * - "Pilih Template" → `/builder/[id]` — buat benar-benar
 *   dipakai/dikustomisasi jadi acara sendiri.
 */
export default function DashboardTemplatesPage() {
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Kunci scroll halaman belakang + tombol Escape menutup, selama modal
  // Preview terbuka — pola modal standar, konsisten dengan FrameEditor dkk.
  useEffect(() => {
    if (!previewId) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [previewId]);

  const previewTpl = previewId ? getTemplate(previewId) : null;

  return (
    <div className="dashboard-fade-in">
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--d-clr-text)", margin: 0 }}>
          Pilih Template
        </h1>
        <p style={{ fontSize: 14, color: "var(--d-clr-text-muted)", marginTop: 6 }}>
          Coba dulu playground-nya lewat Preview, atau langsung Pilih Template untuk
          mulai kustomisasi versi acaramu sendiri — nama, tanggal, bingkai aktif, dan
          tampilannya.
        </p>
      </header>

      {/* auto-fill + lebar TETAP (BUKAN 1fr, sama pola dengan
          app/dashboard/page.tsx) — kartu selalu ukuran sama persis
          berapa pun jumlah templatenya, tidak melar mengisi baris kalau
          kebetulan cuma sedikit. 260px (BUKAN minmax 220-240) — mockup
          HP di dalam kartu ini lebar TETAP 200px (CARD_MOCKUP_W) +
          padding kartu 20px×2 = butuh 240px pas-pasan; minmax dengan
          batas bawah di bawah itu bikin track grid-nya kadang lebih
          sempit dari 240, mockup+tombolnya meluber keluar batas kartu
          (bug nyata yang dilaporkan, bukan dugaan). 260 kasih sedikit
          napas di atas kebutuhan minimum itu. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 260px)",
          gap: 20,
        }}
      >
        {PLAYGROUND_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="dashboard-card"
            style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            {/* Mockup HP kartu — pointerEvents "none", cuma PRATINJAU
                visual. Interaksi sungguhan lewat tombol Preview (modal di
                bawah), bukan di sini. */}
            <div
              aria-hidden
              style={{
                width: CARD_MOCKUP_W,
                height: CARD_MOCKUP_H,
                background: "#0F172A",
                borderRadius: 32,
                padding: CARD_MOCKUP_PADDING,
                border: "3px solid #1E293B",
                boxShadow: "0 16px 34px rgba(0,0,0,0.28)",
                position: "relative",
                flexShrink: 0,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 5,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 60,
                  height: 16,
                  background: "#0F172A",
                  borderRadius: "0 0 10px 10px",
                  zIndex: 10,
                }}
              />
              <div style={{ width: "100%", height: "100%", background: "white", borderRadius: 25, overflow: "hidden", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 375,
                    height: 800,
                    transform: `translate(-50%, -50%) scale(${Math.min(CARD_INNER_W / 375, CARD_INNER_H / 800)})`,
                    pointerEvents: "none",
                  }}
                >
                  <iframe
                    src={`/t/${tpl.id}`}
                    title={`Pratinjau ${tpl.label}`}
                    tabIndex={-1}
                    style={{ width: 375, height: 800, border: "none" }}
                  />
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 56,
                  height: 3,
                  background: "rgba(255,255,255,0.5)",
                  borderRadius: 10,
                }}
              />
            </div>

            <div style={{ width: "100%" }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--d-clr-text)", margin: 0 }}>
                {tpl.label}
              </h2>
              <p style={{ fontSize: 13, color: "var(--d-clr-text-muted)", marginTop: 8, lineHeight: 1.5 }}>
                {tpl.blurb}
              </p>
              <span className="dashboard-badge dashboard-badge-neutral" style={{ marginTop: 12, display: "inline-flex" }}>
                {tpl.frames.length} bingkai
              </span>

              {/* Ditumpuk VERTIKAL (bukan sejajar) — dua tombol sejajar di
                  lebar kartu 260px (dikurangi padding) tidak cukup buat
                  "Pilih Template" + ikon tanpa membungkus baris
                  (.dashboard-btn pakai white-space:nowrap), jadi lebar
                  minimalnya memaksa keluar kartu (bug nyata yang
                  dilaporkan). Ditumpuk = masing-masing full-width, tidak
                  pernah kepepet lagi berapa pun panjang labelnya. */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setPreviewId(tpl.id)}
                  className="dashboard-btn dashboard-btn-outline dashboard-btn-sm"
                  style={{ width: "100%" }}
                >
                  <Eye size={14} />
                  Preview
                </button>
                <Link
                  href={`/builder/${tpl.id}`}
                  className="dashboard-btn dashboard-btn-primary dashboard-btn-sm"
                  style={{ width: "100%" }}
                >
                  Pilih Template
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Preview — mockup HP lagi, lebih besar & interaktif
          (pointerEvents aktif, iframe-nya bisa diklik-klik sungguhan).
          Klik backdrop / tombol X / Escape menutup. */}
      {previewTpl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${previewTpl.label}`}
          onClick={() => setPreviewId(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(15,23,42,0.72)",
            display: "grid", placeItems: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: MODAL_MOCKUP_W }}>
              <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>{previewTpl.label}</span>
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                aria-label="Tutup preview"
                style={{
                  width: 28, height: 28, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)", color: "white", cursor: "pointer",
                  display: "grid", placeItems: "center", padding: 0,
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div
              style={{
                width: MODAL_MOCKUP_W,
                height: MODAL_MOCKUP_H,
                background: "#0F172A",
                borderRadius: 42,
                padding: MODAL_MOCKUP_PADDING,
                border: "4px solid #1E293B",
                boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 88,
                  height: 24,
                  background: "#0F172A",
                  borderRadius: "0 0 16px 16px",
                  zIndex: 10,
                }}
              />
              <div style={{ width: "100%", height: "100%", background: "white", borderRadius: 34, overflow: "hidden", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 375,
                    height: 800,
                    transform: `translate(-50%, -50%) scale(${Math.min(MODAL_INNER_W / 375, MODAL_INNER_H / 800)})`,
                  }}
                >
                  <iframe
                    key={previewTpl.id}
                    src={`/t/${previewTpl.id}`}
                    title={`Preview ${previewTpl.label}`}
                    style={{ width: 375, height: 800, border: "none" }}
                  />
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 80,
                  height: 4,
                  background: "rgba(255,255,255,0.5)",
                  borderRadius: 10,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
