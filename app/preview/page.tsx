"use client";

import { useEffect, useState } from "react";
import EventBooth from "@/components/EventBooth";
import { readPreviewDraft, type PreviewDraft } from "@/lib/dashboard/instances";
import { getTemplate } from "@/lib/templates";

/**
 * Target <iframe> panel kanan Builder (components/dashboard/Builder.tsx) —
 * TIDAK dimaksudkan dibuka langsung oleh siapa pun, tapi tetap route
 * publik biasa (bukan API) supaya bisa jadi src iframe cross-dokumen di
 * origin yang sama. Sengaja BUKAN di bawah app/dashboard/ supaya tidak
 * ikut kebungkus sidebar+topbar DashboardShell — halaman ini harus
 * sepolos booth aslinya.
 *
 * Baca draft dari localStorage (bukan props/URL) karena ini dokumen
 * BERBEDA dari Builder (window brtu di dalam iframe) — satu-satunya
 * jalur data yang tidak butuh server adalah storage bersama + event
 * `storage` bawaan browser, lihat lib/dashboard/instances.ts.
 */
export default function PreviewPage() {
  const [draft, setDraft] = useState<PreviewDraft | null>(null);

  useEffect(() => {
    setDraft(readPreviewDraft());
    function onStorage() {
      setDraft(readPreviewDraft());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!draft) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#14171F", color: "#8A93A6", fontSize: 13, fontFamily: "sans-serif" }}>
        Belum ada pratinjau
      </div>
    );
  }

  const tpl = getTemplate(draft.templateId);
  if (!tpl) return null;

  // key = snapshot field yang tampil di layar — EventBooth cuma
  // re-attach() ke store saat identitas event berubah (event.id/code),
  // BUKAN tiap prop berubah (disengaja, supaya sesi tamu asli tidak
  // ke-reset tiap admin ganti satu warna). Builder JUSTRU butuh
  // sebaliknya: tiap ketikan harus kelihatan. Remount paksa lewat key
  // ini efeknya sama seperti attach() ulang, tanpa mengubah perilaku
  // EventBooth untuk tamu sungguhan.
  const key = JSON.stringify(draft.event);

  return <EventBooth key={key} event={draft.event} templates={tpl.frames} />;
}
