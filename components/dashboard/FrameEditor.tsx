"use client";

import { useRef, useState } from "react";
import type { DetectedFrame } from "@/lib/frameDetect";
import type { Slot, Template } from "@/lib/templates";
import { showErrorToast } from "@/lib/utils";
import { X, Check } from "@/components/icons";

/**
 * Modal koreksi slot bingkai unggahan — dibuka SETELAH lib/frameDetect.ts
 * selesai menebak lubang transparan. Kotak-kotak slot bisa digeser & di-
 * resize manual (deteksi otomatis tidak selalu tepat: lubang tidak
 * persegi, terlalu kecil, saling menempel, dll — lihat AskUserQuestion
 * yang menentukan pola ini, user eksplisit minta ada jalan koreksi, bukan
 * "otomatis saja tanpa koreksi").
 *
 * Lebar pratinjau tetap 320px (DISPLAY_W) berapa pun ukuran asli bingkai
 * — semua interaksi drag/resize dihitung di ruang TAMPILAN lalu dikonversi
 * balik ke ruang KANVAS ASLI (`detected.width/height`) lewat `scale`,
 * karena itu koordinat yang dipakai compositor sungguhan.
 */
const DISPLAY_W = 320;
const MIN_SLOT_PX = 24; // ukuran minimum slot DI RUANG TAMPILAN, cegah resize jadi titik

type DragMode = { index: number; kind: "move" | "resize"; startX: number; startY: number; startSlot: Slot } | null;

export default function FrameEditor({
  detected,
  onConfirm,
  onCancel,
}: {
  detected: DetectedFrame;
  onConfirm: (template: Template) => void;
  onCancel: () => void;
}) {
  const [slots, setSlots] = useState<Slot[]>(detected.slots);
  const [name, setName] = useState("Bingkai Sendiri");
  const stageRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragMode>(null);

  const scale = DISPLAY_W / detected.width;
  const displayH = Math.round(detected.height * scale);

  function toDisplay(v: number) {
    return v * scale;
  }
  function toCanvas(v: number) {
    return v / scale;
  }

  function startDrag(e: React.PointerEvent, index: number, kind: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({ index, kind, startX: e.clientX, startY: e.clientY, startSlot: slots[index] });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const dxCanvas = toCanvas(e.clientX - drag.startX);
    const dyCanvas = toCanvas(e.clientY - drag.startY);
    const s = drag.startSlot;

    setSlots((prev) =>
      prev.map((slot, i) => {
        if (i !== drag.index) return slot;
        if (drag.kind === "move") {
          const x = clamp(s.x + dxCanvas, 0, detected.width - s.w);
          const y = clamp(s.y + dyCanvas, 0, detected.height - s.h);
          return { ...slot, x, y };
        }
        // resize dari sudut kanan-bawah — cukup untuk kebutuhan koreksi,
        // tidak perlu 8 handle di semua sisi untuk kasus ini.
        const minCanvas = toCanvas(MIN_SLOT_PX);
        const w = clamp(s.w + dxCanvas, minCanvas, detected.width - s.x);
        const h = clamp(s.h + dyCanvas, minCanvas, detected.height - s.y);
        return { ...slot, w, h };
      })
    );
  }

  function endDrag() {
    setDrag(null);
  }

  function addSlot() {
    if (slots.length >= 8) {
      showErrorToast("Maksimum 8 slot per bingkai.");
      return;
    }
    const w = detected.width * 0.4;
    const h = detected.height * 0.4;
    setSlots((prev) => [
      ...prev,
      { x: (detected.width - w) / 2, y: (detected.height - h) / 2, w, h },
    ]);
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function confirm() {
    if (slots.length === 0) {
      showErrorToast("Tambahkan minimal satu slot foto dulu.");
      return;
    }
    // 300 DPI itu asumsi cetak standar photobooth — bingkai katalog
    // (lib/templates/lamaran.ts dkk) juga dibuat di kisaran resolusi ini,
    // jadi printSize di sini cuma label perkiraan, bukan dari data cetak
    // sungguhan (memang tidak ada, ini bingkai unggahan, bukan pesanan).
    const printSize = `${(detected.width / 300).toFixed(1)} × ${(detected.height / 300).toFixed(1)}"`;
    onConfirm({
      id: `custom-${Date.now()}`,
      name: name.trim() || "Bingkai Sendiri",
      blurb: "Bingkai unggahan sendiri.",
      width: detected.width,
      height: detected.height,
      printSize,
      overlay: detected.overlay,
      paper: "#FFFFFF",
      slots,
      // Kosong sengaja — lihat catatan di lib/templates/types.ts: bingkai
      // unggahan ini spesifik satu acara, bukan didesain ulang untuk
      // dipakai lintas acara seperti bingkai katalog.
      textLayers: [],
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.6)" }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "white", borderRadius: 20, padding: 24, maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <p style={{ fontWeight: 800, fontSize: 16, color: "var(--d-clr-text)", margin: 0 }}>Atur slot bingkai</p>
          <button onClick={onCancel} aria-label="Tutup" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--d-clr-text-muted)" }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--d-clr-text-muted)", lineHeight: 1.5, margin: "4px 0 16px" }}>
          {slots.length} lubang terdeteksi otomatis. Geser kotak untuk pindah, tarik sudut kanan-bawah untuk ubah ukuran — koreksi dulu kalau ada yang meleset.
        </p>

        <div
          ref={stageRef}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          style={{
            position: "relative",
            width: DISPLAY_W,
            height: displayH,
            margin: "0 auto",
            borderRadius: 12,
            overflow: "hidden",
            backgroundImage:
              "repeating-conic-gradient(#e2e8f0 0% 25%, white 0% 50%) 50% / 16px 16px",
            // Tanpa ini, drag kotak slot kebaca browser sebagai seleksi
            // konten (highlight biru) — bug nyata yang ketemu waktu
            // verifikasi editor foto sambutan di Builder.tsx, pola drag-
            // nya sama jadi ditambahkan di sini juga sebagai jaga-jaga.
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau lokal, bukan aset build */}
          <img src={detected.overlay} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
          {slots.map((slot, i) => (
            <div
              key={i}
              onPointerDown={(e) => startDrag(e, i, "move")}
              style={{
                position: "absolute",
                left: toDisplay(slot.x),
                top: toDisplay(slot.y),
                width: toDisplay(slot.w),
                height: toDisplay(slot.h),
                border: "2px solid var(--d-clr-primary)",
                background: "rgba(25,118,243,0.15)",
                cursor: "move",
                touchAction: "none",
              }}
            >
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => removeSlot(i)}
                aria-label={`Hapus slot ${i + 1}`}
                style={{
                  position: "absolute", top: -10, right: -10, width: 20, height: 20, borderRadius: "50%",
                  background: "#1E293B", color: "white", border: "none", cursor: "pointer", fontSize: 11,
                  display: "grid", placeItems: "center",
                }}
              >
                <X size={11} />
              </button>
              <div
                onPointerDown={(e) => startDrag(e, i, "resize")}
                style={{
                  position: "absolute", bottom: -6, right: -6, width: 16, height: 16, borderRadius: "50%",
                  background: "var(--d-clr-primary)", border: "2px solid white", cursor: "nwse-resize", touchAction: "none",
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={addSlot}
          className="dashboard-btn dashboard-btn-outline dashboard-btn-sm"
          style={{ width: "100%", marginTop: 14 }}
        >
          + Tambah slot manual
        </button>

        <div style={{ marginTop: 16 }}>
          <label className="dashboard-label">Nama bingkai</label>
          <input
            className="dashboard-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onCancel} className="dashboard-btn dashboard-btn-outline" style={{ flex: 1 }}>
            Batal
          </button>
          <button onClick={confirm} className="dashboard-btn dashboard-btn-primary" style={{ flex: 1 }}>
            <Check size={14} />
            Pakai bingkai ini
          </button>
        </div>
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
