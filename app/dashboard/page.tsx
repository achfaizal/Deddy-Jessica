"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Trash2 } from "@/components/icons";
import { listInstances, deleteInstance, INSTANCES_CHANGED, type EventInstance } from "@/lib/dashboard/instances";
import { getTemplate } from "@/lib/templates";
import { showSuccessToast } from "@/lib/utils";

/** Ukuran mockup HP di kartu acara — SAMA persis dengan
    app/dashboard/templates/page.tsx (diminta eksplisit: "bentuknya card
    phone seperti di pilihan template"), konstanta terpisah tetap (bukan
    diimpor) karena dua route berbeda, bukan komponen bersama — kalau nanti
    salah satu ukurannya perlu beda sendiri, tidak saling menyeret. */
const CARD_MOCKUP_W = 200;
const CARD_MOCKUP_H = 400;
const CARD_MOCKUP_PADDING = 7;
const CARD_INNER_W = CARD_MOCKUP_W - CARD_MOCKUP_PADDING * 2;
const CARD_INNER_H = CARD_MOCKUP_H - CARD_MOCKUP_PADDING * 2;

/**
 * "Visual Builder" (sidebar) / "Template Saya" (judul halaman) — beranda dashboard (§11.6
 * UI-UX-DESIGN-SYSTEM.md). "use client" wajib — daftar acara datang dari
 * localStorage (lib/dashboard/instances.ts), tidak bisa diresolusi di
 * server.
 *
 * Kartu SEKARANG mockup HP juga (pola sama dengan katalog "Pilih
 * Template") — bedanya iframe di sini nunjuk ke /e/[id] (link tamu acara
 * ITU SENDIRI, sudah pakai nama/tanggal/bingkai hasil edit user), bukan
 * /t/[id] (contoh template mentah) — supaya pratinjau kartu benar-benar
 * mewakili acara yang sudah dikustomisasi. Satu tombol saja ("Edit
 * Template", bukan Preview+Pilih seperti katalog) — acara ini sudah ada,
 * tinggal dibuka lagi ke Builder, tidak perlu ditawari trial dulu. */
export default function DashboardHomePage() {
  const [instances, setInstances] = useState<EventInstance[] | null>(null);

  useEffect(() => {
    const load = () => setInstances(listInstances());
    load();
    // §9 UI-UX-DESIGN-SYSTEM.md: custom window event, bukan polling —
    // Builder (komponen lain, tidak ada jalur prop ke sini) memicu ini
    // tiap kali upsertInstance() dipanggil.
    window.addEventListener(INSTANCES_CHANGED, load);
    return () => window.removeEventListener(INSTANCES_CHANGED, load);
  }, []);

  // confirm() dipakai apa adanya (bukan modal kustom) — ini aksi
  // destruktif tanpa "undo" (localStorage langsung ditimpa), dan
  // playground ini belum punya komponen modal umum untuk kasus lain,
  // jadi tidak sepadan dibangun cuma untuk satu tombol ini.
  function handleDelete(inst: EventInstance) {
    if (!window.confirm(`Hapus acara "${inst.event.names}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    deleteInstance(inst.id);
    showSuccessToast("Acara dihapus.");
  }

  if (instances === null) return null; // sekejap sebelum localStorage sempat dibaca

  if (instances.length === 0) {
    return (
      <div
        className="dashboard-fade-in"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center", minHeight: "60vh" }}
      >
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--d-clr-bg)", display: "grid", placeItems: "center" }}>
          <CalendarDays size={28} color="var(--d-clr-text-muted)" />
        </div>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--d-clr-text)", marginTop: 16, marginBottom: 6 }}>
          Belum ada acara
        </h1>
        <p style={{ fontSize: 13, color: "var(--d-clr-text-muted)", maxWidth: 280, lineHeight: 1.5, margin: 0 }}>
          Pilih template dulu, lalu kustomisasi nama, tanggal, dan tampilannya jadi versi
          acaramu sendiri.
        </p>
        <Link href="/dashboard/templates" className="dashboard-btn dashboard-btn-primary dashboard-btn-press" style={{ marginTop: 20, textDecoration: "none" }}>
          <Plus size={16} strokeWidth={3} />
          Pilih Template
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-fade-in">
      <header style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--d-clr-text)", margin: 0 }}>
            Template Saya
          </h1>
          <p style={{ fontSize: 14, color: "var(--d-clr-text-muted)", marginTop: 6 }}>
            {instances.length} acara tersimpan di browser ini.
          </p>
        </div>
        <Link href="/dashboard/templates" className="dashboard-btn dashboard-btn-primary dashboard-btn-sm dashboard-btn-press" style={{ textDecoration: "none" }}>
          <Plus size={14} strokeWidth={3} />
          Acara Baru
        </Link>
      </header>

      {/* auto-fill + lebar TETAP (BUKAN 1fr atau minmax) — dengan
          auto-fit+1fr, satu kartu sendirian melar mengisi SATU baris
          penuh (grid cuma punya 1 kolom kalau isinya cuma 1 item),
          kelihatan "kebesaran". minmax(220,240) SEMPAT dicoba tapi
          batas bawahnya (220) lebih sempit dari kebutuhan mockup HP di
          dalam kartu (200px tetap + padding kartu 20px×2 = 240px
          pas-pasan) — track grid-nya kadang jatuh di bawah 240, mockup
          & tombolnya meluber keluar batas kartu (bug nyata yang
          dilaporkan). 260px tetap (bukan rentang) — selalu cukup,
          tidak melar, tidak meluber. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 260px)", gap: 20 }}>
        {instances.map((inst) => {
          const tpl = getTemplate(inst.templateId);

          return (
            <div
              key={inst.id}
              className="dashboard-card"
              style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}
            >
              <button
                onClick={() => handleDelete(inst)}
                aria-label={`Hapus acara ${inst.event.names}`}
                style={{
                  position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(15,23,42,0.55)", color: "white", border: "none", cursor: "pointer",
                  display: "grid", placeItems: "center", backdropFilter: "blur(4px)", zIndex: 2,
                }}
              >
                <Trash2 size={14} />
              </button>

              {/* Mockup HP — pola sama dengan katalog Pilih Template, tapi
                  iframe-nya /e/[id] (link tamu ACARA INI, sudah pakai
                  hasil edit user), bukan /t/[id] (contoh template
                  mentah). pointerEvents "none" — cuma ilustrasi, bukan
                  buat diklik-klik di sini. */}
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
                      src={`/e/${inst.id}`}
                      title={`Pratinjau acara ${inst.event.names}`}
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
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--d-clr-text)", margin: 0 }}>
                  {inst.event.names}
                </h2>
                <p style={{ fontSize: 12, color: "var(--d-clr-text-muted)", marginTop: 6 }}>
                  {inst.event.date} · Template {tpl?.label ?? inst.templateId}
                </p>
                <span className="dashboard-badge dashboard-badge-purple" style={{ marginTop: 10, display: "inline-flex" }}>
                  {new Date(inst.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </span>

                <Link
                  href={`/builder/${inst.templateId}?instance=${inst.id}`}
                  className="dashboard-btn dashboard-btn-primary dashboard-btn-sm"
                  style={{ width: "100%", marginTop: 16, textDecoration: "none" }}
                >
                  Edit Template
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
