"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PlaygroundTemplate, EventConfig, EventTheme, Template, TextLayer, ThemeElements } from "@/lib/templates";
import { tokensFor, VIDEO_CARD_FRAME_ID } from "@/lib/templates";
import { upsertInstance, writePreviewDraft, createInstanceId } from "@/lib/dashboard/instances";
import { showSuccessToast, showErrorToast } from "@/lib/utils";
import { useDebouncedValue, readAndCompressImage } from "@/lib/utils";
import { detectFrameSlots, type DetectedFrame } from "@/lib/frameDetect";
import { compose, composeBase, measureTextLayers, resolveTextLayer, type TextLayerBounds } from "@/lib/compositor";
import { ArrowLeft, Save, Check, Eye, RefreshCw, Upload, ImageIcon, X, Type, Frame, Trash2, Plus, Bold as BoldIcon, Italic as ItalicIcon, Video } from "@/components/icons";
import FrameEditor from "./FrameEditor";

/** Katalog font judul yang bisa dipilih user — semuanya SUDAH terdaftar
    lewat next/font di app/layout.tsx (bukan font baru, jadi tidak nambah
    dependensi/loading time). Tiap entri wajib set `fontDisplay` DAN
    `canvasFontDisplay` BARENGAN (lihat catatan di app/layout.tsx & CLAUDE.md
    §4) — kalau cuma salah satu, teks di layar beda font dengan hasil
    unduhan foto. */
const FONT_OPTIONS = [
  { id: "playfair", label: "Playfair", fontDisplay: "var(--font-playfair)", canvasFontDisplay: "var(--canvas-font-playfair)" },
  { id: "cormorant", label: "Cormorant", fontDisplay: "var(--font-cormorant)", canvasFontDisplay: "var(--canvas-font-cormorant)" },
  { id: "marcellus", label: "Marcellus", fontDisplay: "var(--font-marcellus)", canvasFontDisplay: "var(--canvas-font-marcellus)" },
  { id: "cinzel", label: "Cinzel", fontDisplay: "var(--font-cinzel)", canvasFontDisplay: "var(--canvas-font-cinzel)" },
  { id: "libre", label: "Libre Baskerville", fontDisplay: "var(--font-libre)", canvasFontDisplay: "var(--canvas-font-libre)" },
  { id: "lora", label: "Lora", fontDisplay: "var(--font-lora)", canvasFontDisplay: "var(--canvas-font-lora)" },
  { id: "poppins", label: "Poppins", fontDisplay: "var(--font-poppins)", canvasFontDisplay: "var(--canvas-font-poppins)" },
  { id: "montserrat", label: "Montserrat", fontDisplay: "var(--font-montserrat)", canvasFontDisplay: "var(--canvas-font-montserrat)" },
  { id: "greatvibes", label: "Great Vibes", fontDisplay: "var(--font-greatvibes)", canvasFontDisplay: "var(--canvas-font-greatvibes)" },
  { id: "parisienne", label: "Parisienne", fontDisplay: "var(--font-parisienne)", canvasFontDisplay: "var(--canvas-font-parisienne)" },
  { id: "italianno", label: "Italianno", fontDisplay: "var(--font-italianno)", canvasFontDisplay: "var(--canvas-font-italianno)" },
] as const;

/** Pilihan font per-TEKS (bukan per-tema) di panel "Teks di bingkai ini"
    — beda dari FONT_OPTIONS di atas yang ganti font SATU TEMPLATE
    sepenuhnya (lewat next/font, CLAUDE.md §4). Semua di sini font SISTEM
    (sudah tersedia di semua browser, tidak perlu next/font). Times New
    Roman BAWAAN untuk SEMUA teks lewat Builder ini — termasuk teks bawaan
    template (Nama/Tanggal/label) — diminta eksplisit user, lihat
    getFrameTextLayers(). "Ikuti tema" (value kosong) sekarang jadi PILIHAN
    eksplisit (balik ke Playfair dkk tema template), bukan bawaan lagi. */
const DEFAULT_LAYER_FONT = `"Times New Roman", Times, serif`;
const LAYER_FONT_CHOICES = [
  { value: DEFAULT_LAYER_FONT, label: "Times New Roman" },
  { value: "", label: "Ikuti tema" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: `"Courier New", Courier, monospace`, label: "Courier New" },
];

/** Token tunggal seperti `"{{names}}"` (TANPA teks lain di sekitarnya) —
    dipakai panel "Teks di bingkai ini" membedakan layer yang murni
    mewakili SATU field acara (edit di sini = update draft.names dkk
    langsung, supaya WelcomeScreen dkk ikut sinkron tanpa field terpisah)
    dari layer custom (mis. label "ENGAGEMENT") yang teksnya milik layer
    itu sendiri. */
const TOKEN_KEYS = ["names", "date", "venue", "hashtag", "code"] as const;
type EventTokenKey = (typeof TOKEN_KEYS)[number];
function pureTokenKey(text: string): EventTokenKey | null {
  const m = text.trim().match(/^\{\{(\w+)\}\}$/);
  if (!m) return null;
  return (TOKEN_KEYS as readonly string[]).includes(m[1]) ? (m[1] as EventTokenKey) : null;
}

/** Ukuran phone mockup (§15.27) — SATU sumber, dipakai di kotak bezel
    MAUPUN di penghitungan skala iframe di dalamnya. Sebelumnya dua angka
    ini (ukuran kotak vs skala iframe 0.66) diketik terpisah dan lama-
    lama tidak sinkron — konten pratinjau nempel cuma di kiri-atas,
    nyisain celah kosong asimetris di kanan/bawah ("kepotong, tidak
    simetris" — bug nyata yang dilaporkan, sudah diverifikasi hitungannya
    lewat coordinat sebelum diperbaiki). */
const MOCKUP_W = 280;
const MOCKUP_H = 560;
const MOCKUP_PADDING = 9;
const MOCKUP_INNER_W = MOCKUP_W - MOCKUP_PADDING * 2;
const MOCKUP_INNER_H = MOCKUP_H - MOCKUP_PADDING * 2;

/** Ukuran maksimum kartu tab "Edit Bingkai" — SENGAJA TERPISAH dari
    MOCKUP_* di atas. Bingkai yang diedit di tab ini adalah hasil CETAK
    (bukan simulasi layar HP tamu), jadi tidak dibungkus bezel ponsel dan
    boleh lebih leluasa ukurannya — lihat komentar di JSX pemilihan tab.
    Dua batas (lebar & tinggi) dipakai bareng supaya bingkai super-tinggi
    (mis. lamaran-2/3, 800×1966) tetap muat penuh, tidak cuma dibatasi
    lebar seperti FrameThumb lama. */
const FRAME_EDIT_MAX_W = 420;
const FRAME_EDIT_MAX_H = 640;

/**
 * Visual Builder — panel kontrol kiri (380px) + pratinjau langsung kanan
 * (§11.8 UI-UX-DESIGN-SYSTEM.md). Pratinjau dirender lewat <iframe> ke
 * app/preview/page.tsx, BUKAN <EventBooth> langsung di dokumen ini — lihat
 * catatan panjang di app/preview/page.tsx kenapa (unit `dvh` butuh
 * viewport browser sungguhan, iframe = satu-satunya cara dapat itu tanpa
 * membongkar EventBooth).
 */
export default function Builder({
  template,
  instanceId: existingInstanceId,
  initialEvent,
}: {
  template: PlaygroundTemplate;
  /** Kosong = bikin acara baru; terisi = sedang edit acara yang sudah ada
      (dibuka dari "Acara Saya"). */
  instanceId?: string;
  initialEvent?: EventConfig;
}) {
  const [instanceId] = useState(() => existingInstanceId ?? createInstanceId());
  const [draft, setDraft] = useState<EventConfig>(() => normalizeHeroPhoto(initialEvent ?? template.event));
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");
  const [guestUrl, setGuestUrl] = useState<string | null>(
    existingInstanceId ? null : null // diisi setelah simpan pertama, atau saat mount kalau sudah pernah
  );
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [frameDetecting, setFrameDetecting] = useState(false);
  const [frameEditorData, setFrameEditorData] = useState<DetectedFrame | null>(null);
  const frameFileInputRef = useRef<HTMLInputElement>(null);
  /** Drag-untuk-geser foto sambutan — nilai AWAL posX/posY dicatat saat
      pointerdown, dipakai relatif (bukan absolut) supaya jarinya tidak
      "melompat" ke posisi drag pertama begitu mouse ditekan. */
  const [photoDragStart, setPhotoDragStart] = useState<{ x: number; y: number; posX: number; posY: number } | null>(null);
  // Dua tab MENENTUKAN APA YANG TAMPIL DI PANEL KANAN — bukan cuma
  // ngelompokin field. "bingkai" = editor drag bingkai terpilih (lihat
  // FrameTextEditor — TANPA bezel HP, karena yang diedit hasil cetak,
  // bukan simulasi layar HP). "playground" = mockup HP + iframe
  // WelcomeScreen seperti sebelumnya. Default "bingkai" karena itu urutan
  // alur yang diminta: user atur bingkai+nama dulu, baru lanjut ke
  // tampilan layar sambutan.
  const [activeTab, setActiveTab] = useState<"bingkai" | "playground">("bingkai");
  // Bingkai mana yang ditampilkan BESAR di mockup saat tab "bingkai" aktif
  // — diisi otomatis ke bingkai aktif pertama begitu tersedia (lihat efek
  // di bawah), user bisa ganti lewat pemilih di atas mockup.
  const [previewFrameId, setPreviewFrameId] = useState<string | null>(null);

  const debouncedDraft = useDebouncedValue(draft, 400);
  // Dipakai FrameThumb (pratinjau bingkai) — sengaja dari draft yang SUDAH
  // di-debounce (bukan draft mentah), supaya tidak render ulang canvas di
  // setiap ketukan huruf saat user ngetik nama/tanggal.
  const frameTokens = tokensFor(debouncedDraft);

  // Daftar bingkai yang tamu SUNGGUHAN bisa pilih (bawaan yang tidak
  // dimatikan + unggahan sendiri) — sumbernya sama persis dengan logika
  // EventBooth.tsx (effectiveTemplates), supaya pemilih pratinjau ini
  // tidak pernah menawarkan bingkai yang sebenarnya nonaktif.
  const activeFrames = [
    ...template.frames.filter((f) => !draft.disabledFrameIds?.includes(f.id)),
    ...(draft.customFrames ?? []),
  ];

  // "Kartu Video" — bingkai SEMU (bukan bingkai foto sungguhan, TIDAK
  // pernah ditawarkan ke tamu memilih bingkai) yang mewakili latar kartu
  // video pesan suara (EventTheme.videoBg + videoTextLayers). Dibuat cuma
  // supaya bisa numpang infrastruktur bingkai yang sudah ada APA ADANYA
  // (FrameTextEditor, getFrameTextLayers, dst) — sengaja BUKAN masuk
  // activeFrames (itu daftar bingkai foto sungguhan buat StepFrame tamu).
  // null kalau template ini belum punya videoTextLayers (belum ada versi
  // token-nya) — tidak usah ditawarkan sama sekali daripada nongol kosong
  // tidak bisa diapa-apakan.
  const videoCardFrame: Template | null =
    draft.theme?.videoTextLayers?.length
      ? {
          id: VIDEO_CARD_FRAME_ID,
          name: "Kartu Video",
          blurb: "",
          width: 1080,
          height: 1920,
          printSize: "",
          slots: [],
          overlay: draft.theme.videoBg ?? "",
          paper: draft.theme.ink ?? "#FFFFFF",
          textLayers: draft.theme.videoTextLayers,
        }
      : null;
  // Daftar buat PEMILIH & pratinjau saja (pills di atas mockup + FrameTextEditor)
  // — activeFrames sendiri TETAP murni bingkai foto, tidak ikut ketambahan
  // ini, supaya tidak ada tempat lain yang keliru mengira "Kartu Video"
  // salah satu pilihan bingkai tamu.
  const pickerFrames = videoCardFrame ? [...activeFrames, videoCardFrame] : activeFrames;
  const previewFrame = pickerFrames.find((f) => f.id === previewFrameId) ?? activeFrames[0] ?? null;

  // previewFrameId otomatis ikut bingkai aktif PERTAMA begitu daftar
  // bingkai berubah (mis. user baru unggah satu / mematikan yang lagi
  // dipreview) — supaya pemilih tidak pernah nunjuk ke bingkai yang sudah
  // tidak aktif/tidak ada lagi.
  useEffect(() => {
    if (activeFrames.length === 0) return;
    if (!activeFrames.some((f) => f.id === previewFrameId)) {
      setPreviewFrameId(activeFrames[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.disabledFrameIds, draft.customFrames, template.frames]);

  // Kalau ini edit acara yang sudah ada, link tamunya sudah valid sejak
  // awal (tidak perlu tunggu klik Simpan lagi).
  useEffect(() => {
    if (existingInstanceId) setGuestUrl(`${window.location.origin}/e/${existingInstanceId}`);
  }, [existingInstanceId]);

  // Tulis ke draft pratinjau (localStorage) tiap ketikan MENETAP 400ms —
  // iframe app/preview/page.tsx mendengarkan lewat event `storage`.
  useEffect(() => {
    writePreviewDraft({ templateId: template.id, event: debouncedDraft });
  }, [debouncedDraft, template.id]);

  function update<K extends keyof EventConfig>(key: K, value: EventConfig[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaveState("idle");
  }

  /** Update sebagian `theme.elements` — dipisah dari update() di atas
      karena ini dua-tiga level lebih dalam (draft.theme.elements.heroPhoto)
      dan theme/elements keduanya opsional, jadi butuh fallback di tiap
      level supaya tidak menimpa field lain yang sudah diisi. */
  function updateElements(patch: Partial<ThemeElements>) {
    setDraft((d) => {
      if (!d.theme) return d; // tidak ada template tanpa theme di katalog kita, tapi TS perlu ini
      return { ...d, theme: { ...d.theme, elements: { ...d.theme.elements, ...patch } } };
    });
    setSaveState("idle");
  }

  async function handlePhotoFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showErrorToast("File harus berupa gambar.");
      return;
    }
    setUploading(true);
    try {
      const url = await readAndCompressImage(file);
      const current = draft.theme?.elements?.heroPhoto;
      // Mode selalu "cover" (latar penuh) — pilihan Bulat/Banner sengaja
      // dihapus dari Edit, bukan sekadar disembunyikan (lihat
      // normalizeHeroPhoto di bawah): keduanya sering menyisakan garis
      // sambungan foto/latar, sementara "cover" tidak punya batas yang
      // perlu disambung sama sekali.
      updateElements({
        heroPhoto: { mode: "cover", url, size: current?.size ?? 160, overlay: current?.overlay ?? 90 },
      });
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Foto gagal diunggah.");
    } finally {
      setUploading(false);
    }
  }

  function removePhoto() {
    updateElements({ heroPhoto: { mode: "hidden" } });
  }

  /** Bingkai katalog (dari template.frames) dimatikan/dinyalakan lewat
      daftar ID, BUKAN dihapus dari array — bingkainya tetap ada di
      katalog, cuma disaring EventBooth.tsx saat sesi tamu jalan. */
  function toggleBuiltinFrame(frameId: string) {
    setDraft((d) => {
      const current = d.disabledFrameIds ?? [];
      const disabled = current.includes(frameId)
        ? current.filter((id) => id !== frameId)
        : [...current, frameId];
      return { ...d, disabledFrameIds: disabled };
    });
    setSaveState("idle");
  }

  async function handleFrameUpload(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/png")) {
      showErrorToast("Bingkai harus PNG dengan lubang transparan.");
      return;
    }
    setFrameDetecting(true);
    try {
      const detected = await detectFrameSlots(file);
      if (detected.slots.length === 0) {
        showErrorToast("Tidak ada lubang transparan terdeteksi — pastikan PNG punya area transparan tempat foto akan ditempel.");
        return;
      }
      setFrameEditorData(detected);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Bingkai gagal diproses.");
    } finally {
      setFrameDetecting(false);
    }
  }

  function handleFrameConfirm(tpl: Template) {
    setDraft((d) => ({ ...d, customFrames: [...(d.customFrames ?? []), tpl] }));
    setSaveState("idle");
    setFrameEditorData(null);
    showSuccessToast("Bingkai ditambahkan!");
  }

  function removeCustomFrame(frameId: string) {
    setDraft((d) => ({ ...d, customFrames: (d.customFrames ?? []).filter((f) => f.id !== frameId) }));
    setSaveState("idle");
  }

  /** Update sebagian `theme` (bukan `theme.elements`) — dipisah dari
      updateElements karena font & warna aksen adalah field theme
      LANGSUNG, bukan di dalam elements. */
  function updateTheme(patch: Partial<EventTheme>) {
    setDraft((d) => (d.theme ? { ...d, theme: { ...d.theme, ...patch } } : d));
    setSaveState("idle");
  }

  /** textLayers AKTIF untuk satu bingkai — override tersimpan
      (draft.frameTextLayers[frameId]) kalau user pernah edit, DIPAKAI APA
      ADANYA (termasuk fontFamily kosong = user sengaja pilih "Ikuti
      tema") — TIDAK di-inject default lagi begitu override ada, supaya
      pilihan itu tidak ketiban default di bawah terus-menerus.
      Belum pernah diedit = pakai bawaan template TAPI fontFamily kosong
      di-inject Times New Roman (bukan ikut tema Playfair lagi) — diminta
      eksplisit user supaya SEMUA teks (termasuk Nama/Tanggal/label
      bawaan) defaultnya Times New Roman sampai diganti manual lewat
      dropdown font. */
  function getFrameTextLayers(f: Template): TextLayer[] {
    const override = draft.frameTextLayers?.[f.id];
    if (override) return override;
    return f.textLayers.map((l) => (l.fontFamily ? l : { ...l, fontFamily: DEFAULT_LAYER_FONT }));
  }

  /** Simpan override textLayers satu bingkai — dipanggil FrameTextEditor
      tiap kali user geser/edit/tambah/hapus teks. */
  function setFrameTextLayers(frameId: string, layers: TextLayer[]) {
    setDraft((d) => ({ ...d, frameTextLayers: { ...d.frameTextLayers, [frameId]: layers } }));
    setSaveState("idle");
  }

  /** Ganti ISI (bukan posisi) satu layer — dipanggil dari input teks di
      panel kiri, pasangan dari drag posisi di FrameTextEditor kanan. */
  function updateFrameTextLayerText(f: Template, index: number, text: string) {
    const layers = getFrameTextLayers(f);
    setFrameTextLayers(f.id, layers.map((l, i) => (i === index ? { ...l, text } : l)));
  }

  /** Ganti FONT (bukan isi/posisi) satu layer, dari dropdown LAYER_FONT_CHOICES
      di panel kiri — "" tersimpan sebagai undefined (Ikuti tema, lihat
      TextLayer.fontFamily di types.ts). */
  function updateFrameTextLayerFont(f: Template, index: number, fontFamily: string) {
    const layers = getFrameTextLayers(f);
    setFrameTextLayers(f.id, layers.map((l, i) => (i === index ? { ...l, fontFamily: fontFamily || undefined } : l)));
  }

  /** Toggle BOLD satu layer — weight standar 700 (nyala) / 400 (mati).
      Beda dari weight bawaan template (mis. 600 di Nama/Tanggal lamaran)
      — begitu di-toggle, weight sebelumnya diganti nilai standar ini,
      bukan dipertahankan granular (tombol Bold cuma nyala/mati). */
  function updateFrameTextLayerWeight(f: Template, index: number, bold: boolean) {
    const layers = getFrameTextLayers(f);
    setFrameTextLayers(f.id, layers.map((l, i) => (i === index ? { ...l, weight: bold ? 700 : 400 } : l)));
  }

  /** Toggle MIRING satu layer. */
  function updateFrameTextLayerItalic(f: Template, index: number, italic: boolean) {
    const layers = getFrameTextLayers(f);
    setFrameTextLayers(f.id, layers.map((l, i) => (i === index ? { ...l, italic } : l)));
  }

  /** Ganti WARNA satu layer, dari <input type="color"> di panel kiri. */
  function updateFrameTextLayerColor(f: Template, index: number, color: string) {
    const layers = getFrameTextLayers(f);
    setFrameTextLayers(f.id, layers.map((l, i) => (i === index ? { ...l, color } : l)));
  }

  /** Teks baru default TENGAH kanvas, ukuran & warna wajar — user tinggal
      geser & ketik ulang isinya. Warna pakai theme.flash (aksen) template
      ini kalau ada, biar senada tanpa perlu color picker terpisah. */
  function addFrameTextLayer(f: Template) {
    const layers = getFrameTextLayers(f);
    if (layers.length >= 10) {
      showErrorToast("Maksimum 10 teks per bingkai.");
      return;
    }
    const newLayer: TextLayer = {
      text: "Teks baru",
      x: f.width / 2,
      y: f.height / 2,
      size: Math.round(f.width * 0.05),
      align: "center",
      color: draft.theme?.flash ?? "#000000",
      face: "display",
      fontFamily: DEFAULT_LAYER_FONT,
      maxWidth: f.width * 0.8,
    };
    setFrameTextLayers(f.id, [...layers, newLayer]);
  }

  /** Buang override — bingkai ini balik pakai textLayers bawaan template
      apa adanya (draft.frameTextLayers[id] dihapus, bukan diisi array
      kosong — array kosong berarti "sengaja tanpa teks sama sekali",
      beda makna dari "belum pernah diedit"). */
  function resetFrameTextLayers(frameId: string) {
    setDraft((d) => {
      if (!d.frameTextLayers?.[frameId]) return d;
      const next = { ...d.frameTextLayers };
      delete next[frameId];
      return { ...d, frameTextLayers: next };
    });
    setSaveState("idle");
  }

  function handleSave() {
    upsertInstance(instanceId, template.id, draft);
    setSaveState("saved");
    setGuestUrl(`${window.location.origin}/e/${instanceId}`);
    showSuccessToast("Acara tersimpan!");
    setTimeout(() => setSaveState("idle"), 2000);
  }

  function handleCopy() {
    if (!guestUrl) return;
    navigator.clipboard.writeText(guestUrl).then(() => {
      setCopied(true);
      showSuccessToast("📋 Link disalin!");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const accent = draft.theme?.flash ?? "var(--d-clr-primary)";

  return (
    // position:relative+z-index — sama seperti DashboardShell.tsx, lihat
    // catatan panjang di sana soal blob ambient app/layout.tsx.
    <div
      className="dashboard-root builder-shell"
      style={{ position: "relative", zIndex: 10, display: "flex", height: "100vh", overflow: "hidden" }}
    >
      {/* PANEL KIRI — kontrol */}
      <div
        className="builder-panel-left"
        style={{
          width: 380,
          background: "white",
          borderRight: "1px solid var(--d-clr-border)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 24px rgba(0,0,0,0.04)",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--d-clr-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link
              href="/dashboard/templates"
              className="dashboard-btn dashboard-btn-outline dashboard-btn-sm dashboard-btn-pill"
              style={{ textDecoration: "none" }}
            >
              <ArrowLeft size={14} />
              Kembali
            </Link>
          </div>
          <p style={{ fontWeight: 900, fontSize: 16, color: "var(--d-clr-text)", margin: "12px 0 0" }}>
            Visual Builder
          </p>
          <p style={{ fontSize: 11, color: "var(--d-clr-text-muted)", margin: "2px 0 0" }}>{template.label}</p>
        </div>
        {/* Garis aksen — warnanya ikut warna aksen tema draft saat ini,
            sinyal kecil "panel ini terhubung ke pilihan itu" (§11.8 poin 2). */}
        <div style={{ height: 3, background: accent, transition: "background 0.3s" }} />

        {/* Dua tab yang MENGONTROL MOCKUP KANAN (lihat komentar activeTab
            di atas) — beda dari tab lama (Info Acara/Tampilan, sempat
            digabung lalu dipisah lagi) yang cuma ngelompokin field tanpa
            memengaruhi pratinjau. */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "flex", gap: 6, background: "var(--d-clr-bg)", borderRadius: 14, padding: 5 }}>
            {(["bingkai", "playground"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  flex: 1,
                  padding: "10px 8px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "background .15s, color .15s",
                  background: activeTab === t ? "#0F172A" : "transparent",
                  color: activeTab === t ? "white" : "var(--d-clr-text-muted)",
                }}
              >
                {t === "bingkai" ? "Edit Bingkai" : "Playground"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
        {activeTab === "bingkai" && (
          <>
          {/* Teks di bingkai — PALING ATAS (sebelumnya field umum "Nama
              acara"/"Tanggal" terpisah di sini, sudah dihapus) — sekarang
              satu-satunya tempat edit teks. Layer yang isinya PERSIS satu
              token (mis. text="{{names}}") menampilkan & mengedit NILAI
              ASLI-nya di sini (nulis "Salma & Faizal" langsung update
              draft.names) — WelcomeScreen dkk di tab Playground otomatis
              ikut nilai yang sama, field-nya tidak perlu dobel. Layer
              custom (bukan token murni, mis. label "ENGAGEMENT") tetap
              edit teksnya sendiri apa adanya (lihat pureTokenKey). */}
          {previewFrame && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label className="dashboard-label" style={{ display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
                  <Type size={12} />
                  Teks di bingkai ini
                </label>
                {draft.frameTextLayers?.[previewFrame.id] && (
                  <button
                    onClick={() => resetFrameTextLayers(previewFrame.id)}
                    style={{ fontSize: 11, color: "var(--d-clr-text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Kembalikan ke bawaan
                  </button>
                )}
              </div>
              <p style={{ fontSize: 12, color: "var(--d-clr-text-muted)", lineHeight: 1.5, margin: "4px 0 10px" }}>
                Geser langsung di pratinjau kanan untuk pindah posisi, tarik pojok kotaknya untuk
                besar-kecilkan, atau ketik ulang isinya di sini.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {getFrameTextLayers(previewFrame).map((layer, i) => {
                  const tokenKey = pureTokenKey(layer.text);
                  // >=600 dianggap "bold aktif" — cocok dengan weight
                  // bawaan Nama/Tanggal (600, sudah cukup tebal secara
                  // visual), bukan cuma persis 700.
                  const bold = (layer.weight ?? 400) >= 600;
                  const italic = layer.italic ?? false;
                  const layerLabel = layer.label || `teks ${i + 1}`;
                  const fontLabel = LAYER_FONT_CHOICES.find((o) => o.value === (layer.fontFamily ?? ""))?.label ?? "Font lain";
                  return (
                    // SATU BARIS — urutan: teks, font, bold, miring, warna,
                    // hapus. Font/bold/miring semua tombol IKON ukuran sama
                    // (32px) biar sejajar rapi — sebelumnya dropdown font
                    // teksnya kepotong/bertimpa sama panah dropdown di
                    // kotak sesempit itu.
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <input
                        type="text"
                        value={tokenKey ? draft[tokenKey] : layer.text}
                        onChange={(e) =>
                          tokenKey
                            ? update(tokenKey, e.target.value)
                            : updateFrameTextLayerText(previewFrame, i, e.target.value)
                        }
                        placeholder={layer.label || `Teks ${i + 1}`}
                        className="dashboard-input"
                        style={{ flex: 1, fontSize: 13, minWidth: 0 }}
                      />
                      {/* Ikon font — <select> SUNGGUHAN ditumpuk transparan
                          di atas ikon (bukan dropdown teks yang kelihatan)
                          supaya tetap native/accessible tapi tampilannya
                          ikon persegi sejajar dengan Bold/Miring, dan nama
                          font panjang ("Times New Roman") tidak pernah
                          kepotong lagi karena daftar pilihannya dirender
                          browser sendiri (popup native), bukan di dalam
                          kotak 32px ini. */}
                      <div style={{ position: "relative", width: 32, height: 32, flexShrink: 0 }}>
                        <div
                          aria-hidden
                          title={`Font: ${fontLabel}`}
                          style={{
                            width: 32, height: 32, borderRadius: 6, border: "1px solid var(--d-clr-border)",
                            display: "grid", placeItems: "center", color: "var(--d-clr-text-muted)", pointerEvents: "none",
                          }}
                        >
                          <Type size={14} />
                        </div>
                        <select
                          value={layer.fontFamily ?? ""}
                          onChange={(e) => updateFrameTextLayerFont(previewFrame, i, e.target.value)}
                          aria-label={`Font untuk ${layerLabel} (sekarang: ${fontLabel})`}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                        >
                          {LAYER_FONT_CHOICES.map((opt) => (
                            <option key={opt.label} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => updateFrameTextLayerWeight(previewFrame, i, !bold)}
                        aria-label={bold ? `Matikan bold ${layerLabel}` : `Bold-kan ${layerLabel}`}
                        aria-pressed={bold}
                        title="Bold"
                        style={{
                          width: 32, height: 32, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                          display: "grid", placeItems: "center",
                          border: bold ? "1.5px solid var(--d-clr-primary)" : "1px solid var(--d-clr-border)",
                          background: bold ? "var(--d-clr-primary-light)" : "white",
                          color: bold ? "var(--d-clr-primary)" : "var(--d-clr-text-muted)",
                        }}
                      >
                        <BoldIcon size={14} />
                      </button>
                      <button
                        onClick={() => updateFrameTextLayerItalic(previewFrame, i, !italic)}
                        aria-label={italic ? `Matikan miring ${layerLabel}` : `Miringkan ${layerLabel}`}
                        aria-pressed={italic}
                        title="Miring"
                        style={{
                          width: 32, height: 32, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                          display: "grid", placeItems: "center",
                          border: italic ? "1.5px solid var(--d-clr-primary)" : "1px solid var(--d-clr-border)",
                          background: italic ? "var(--d-clr-primary-light)" : "white",
                          color: italic ? "var(--d-clr-primary)" : "var(--d-clr-text-muted)",
                        }}
                      >
                        <ItalicIcon size={14} />
                      </button>
                      <input
                        type="color"
                        value={layer.color}
                        onChange={(e) => updateFrameTextLayerColor(previewFrame, i, e.target.value)}
                        aria-label={`Warna ${layerLabel}`}
                        title="Warna"
                        style={{
                          width: 32, height: 32, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                          border: "1px solid var(--d-clr-border)", padding: 2, background: "white",
                        }}
                      />
                      <button
                        onClick={() => setFrameTextLayers(previewFrame.id, getFrameTextLayers(previewFrame).filter((_, idx) => idx !== i))}
                        aria-label={`Hapus teks ${layerLabel}`}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--d-clr-text-muted)", display: "grid", placeItems: "center", flexShrink: 0 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => addFrameTextLayer(previewFrame)}
                className="dashboard-btn dashboard-btn-outline dashboard-btn-sm"
                style={{ width: "100%", marginTop: 8 }}
              >
                <Plus size={14} />
                Tambah teks
              </button>
            </div>
          )}

          <div style={{ height: 1, background: "var(--d-clr-border)", margin: "20px 0 16px" }} />

          <label className="dashboard-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Frame size={12} />
            Bingkai
          </label>
          <p style={{ fontSize: 12, color: "var(--d-clr-text-muted)", lineHeight: 1.5, margin: "4px 0 12px" }}>
            Matikan bingkai katalog yang tidak dipakai, atau unggah bingkai PNG sendiri
            (lubang transparan terdeteksi otomatis jadi slot foto). Klik salah satu untuk
            lihat pratinjau besarnya di kanan.
          </p>

          {/* Bingkai katalog — toggle aktif/nonaktif, tidak pernah dihapus
              dari daftar (cuma disaring EventBooth.tsx). Minimal SATU
              bingkai wajib tetap aktif, jangan sampai tamu buka sesi
              tanpa bingkai sama sekali. Klik barisnya (bukan cuma toggle)
              buat jadikan ini yang dipreview besar di mockup. */}
          {template.frames.map((f) => {
            const disabled = draft.disabledFrameIds?.includes(f.id) ?? false;
            const activeCount = template.frames.length - (draft.disabledFrameIds?.length ?? 0)
              + (draft.customFrames?.length ?? 0);
            const isLastActive = !disabled && activeCount <= 1;
            const isPreviewing = previewFrame?.id === f.id;
            return (
              <div
                key={f.id}
                onClick={() => !disabled && setPreviewFrameId(f.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", borderRadius: 10, marginBottom: 8,
                  border: isPreviewing ? "1.5px solid var(--d-clr-primary)" : "1px solid var(--d-clr-border)",
                  background: isPreviewing ? "var(--d-clr-primary-light)" : "transparent",
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? "default" : "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <FrameThumb template={f} tokens={frameTokens} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--d-clr-text)" }}>{f.name}</span>
                </div>
                <ToggleSwitch
                  checked={!disabled}
                  disabled={isLastActive}
                  onChange={() => {
                    if (isLastActive) {
                      showErrorToast("Minimal satu bingkai harus tetap aktif.");
                      return;
                    }
                    toggleBuiltinFrame(f.id);
                  }}
                />
              </div>
            );
          })}

          {/* Bingkai unggahan user — daftar terpisah dari katalog, boleh
              dihapus permanen (bukan cuma dimatikan) karena ini memang
              milik acara ini sendiri, bukan aset katalog. */}
          {(draft.customFrames ?? []).map((f) => {
            const isPreviewing = previewFrame?.id === f.id;
            return (
            <div
              key={f.id}
              onClick={() => setPreviewFrameId(f.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 10, marginBottom: 8, cursor: "pointer",
                border: isPreviewing ? "1.5px solid var(--d-clr-primary)" : "1px solid var(--d-clr-border)",
                background: isPreviewing ? "var(--d-clr-primary-light)" : "var(--d-clr-primary-light)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <FrameThumb template={f} tokens={frameTokens} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--d-clr-text)" }}>{f.name} <span style={{ fontWeight: 400, color: "var(--d-clr-text-muted)" }}>(unggahan)</span></span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeCustomFrame(f.id); }}
                aria-label={`Hapus bingkai ${f.name}`}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--d-clr-text-muted)", display: "grid", placeItems: "center" }}
              >
                <Trash2 size={14} />
              </button>
            </div>
            );
          })}

          {/* Kartu Video — bingkai SEMU (bukan foto, lihat videoCardFrame
              di atas), ditaruh di daftar yang SAMA persis (bukan cuma
              pill di atas mockup, yang kurang kelihatan) supaya user
              langsung nemu tempat edit sapaan/nama/tanggal kartu video
              tanpa perlu tahu itu "beda kategori" dari bingkai foto. TANPA
              ToggleSwitch — tidak bisa dimatikan seperti bingkai foto,
              selalu relevan selama pesan suara aktif. */}
          {videoCardFrame && (
            <div
              onClick={() => setPreviewFrameId(videoCardFrame.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, minWidth: 0,
                padding: "10px 12px", borderRadius: 10, marginBottom: 12, cursor: "pointer",
                border: previewFrame?.id === videoCardFrame.id ? "1.5px solid var(--d-clr-primary)" : "1px dashed var(--d-clr-border)",
                background: previewFrame?.id === videoCardFrame.id ? "var(--d-clr-primary-light)" : "transparent",
              }}
            >
              <FrameThumb template={videoCardFrame} tokens={frameTokens} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--d-clr-text)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Video size={12} />
                  {videoCardFrame.name}
                </span>
                <span style={{ fontSize: 11, color: "var(--d-clr-text-muted)" }}>Latar kartu video pesan suara</span>
              </div>
            </div>
          )}

          <button
            onClick={() => frameFileInputRef.current?.click()}
            disabled={frameDetecting}
            className="dashboard-btn dashboard-btn-outline dashboard-btn-sm"
            style={{ width: "100%", marginTop: 4 }}
          >
            <Upload size={14} />
            {frameDetecting ? "Mendeteksi slot…" : "Unggah bingkai sendiri"}
          </button>

          <input
            ref={frameFileInputRef}
            type="file"
            accept="image/png"
            style={{ display: "none" }}
            onChange={(e) => {
              handleFrameUpload(e.target.files?.[0]);
              e.target.value = ""; // reset supaya file sama bisa dipilih lagi kalau dibatalkan di editor
            }}
          />

          {frameEditorData && (
            <FrameEditor
              detected={frameEditorData}
              onConfirm={handleFrameConfirm}
              onCancel={() => setFrameEditorData(null)}
            />
          )}
          </>
        )}

        {activeTab === "playground" && (
          <>
          <Field label="Sapaan besar (kicker & header sesi)">
            <input
              className="dashboard-input"
              value={draft.brandLabel ?? ""}
              onChange={(e) => update("brandLabel", e.target.value)}
              placeholder="mis. Happy Wedding"
              maxLength={40}
            />
          </Field>
          <Field label="Tempat">
            <input
              className="dashboard-input"
              value={draft.venue}
              onChange={(e) => update("venue", e.target.value)}
            />
          </Field>
          <Field label="Hashtag">
            <input
              className="dashboard-input"
              value={draft.hashtag}
              onChange={(e) => update("hashtag", e.target.value)}
              placeholder="#NamaAcaraKamu"
            />
          </Field>
          <Field label="Sambutan">
            <textarea
              className="dashboard-input"
              value={draft.greeting}
              onChange={(e) => update("greeting", e.target.value)}
              rows={4}
              style={{ resize: "vertical", fontFamily: "var(--font-sans)" }}
            />
          </Field>

        {(() => {
          const hero = draft.theme?.elements?.heroPhoto;
          const hasPhoto = !!hero?.url;
          return (
            <>
              <div style={{ height: 1, background: "var(--d-clr-border)", margin: "20px 0 16px" }} />
              <label className="dashboard-label">Foto sambutan</label>
              <p style={{ fontSize: 12, color: "var(--d-clr-text-muted)", lineHeight: 1.5, margin: "4px 0 12px" }}>
                Ganti logo lingkaran di layar sambutan dengan foto sendiri — memenuhi satu layar penuh.
              </p>

              {!hasPhoto ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handlePhotoFile(e.dataTransfer.files?.[0]);
                  }}
                  style={{
                    border: "2px dashed var(--d-clr-border)",
                    borderRadius: 16,
                    padding: "32px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all .15s",
                    background: dragOver ? "var(--d-clr-primary-light)" : "transparent",
                    borderColor: dragOver ? "var(--d-clr-primary)" : "var(--d-clr-border)",
                  }}
                >
                  <Upload size={28} color="var(--d-clr-text-muted)" style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--d-clr-text)", margin: "0 0 4px" }}>
                    {uploading ? "Mengunggah…" : "Klik atau seret foto ke sini"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--d-clr-text-muted)", margin: 0 }}>JPG/PNG, dikecilkan otomatis</p>
                </div>
              ) : (
                <div>
                  {/* Drag buat geser titik fokus, slider buat zoom — geser
                      DIHITUNG RELATIF terhadap posX/posY saat pointerdown
                      (photoDragStart), bukan langsung dari posisi mouse,
                      supaya tidak "melompat". Arahnya dibalik (mouse ke
                      kanan → posX TURUN): drag di sini meniru "menggeser
                      fotonya", bukan "menggeser jendela lihatnya" — drag
                      kanan = foto ikut ke kanan = bagian KIRI foto yang
                      tadi tersembunyi jadi kelihatan = titik fokus (posX)
                      harus turun. object-position bekerja kebalikannya. */}
                  <div
                    style={{
                      position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 8,
                      touchAction: "none", cursor: photoDragStart ? "grabbing" : "grab",
                      // Tanpa ini, drag-nya kebaca browser sebagai SELEKSI
                      // konten (highlight biru menutupi seluruh area) alih-
                      // alih interaksi kustom kita — ketahuan pas verifikasi
                      // screenshot, bukan cuma dugaan.
                      userSelect: "none",
                      WebkitUserSelect: "none",
                    }}
                    onPointerDown={(e) => {
                      (e.target as Element).setPointerCapture(e.pointerId);
                      setPhotoDragStart({ x: e.clientX, y: e.clientY, posX: hero.posX ?? 50, posY: hero.posY ?? 50 });
                    }}
                    onPointerMove={(e) => {
                      if (!photoDragStart) return;
                      const el = e.currentTarget;
                      const rect = el.getBoundingClientRect();
                      const dxPct = ((e.clientX - photoDragStart.x) / rect.width) * 100;
                      const dyPct = ((e.clientY - photoDragStart.y) / rect.height) * 100;
                      updateElements({
                        heroPhoto: {
                          ...hero,
                          posX: clampPct(photoDragStart.posX - dxPct),
                          posY: clampPct(photoDragStart.posY - dyPct),
                        },
                      });
                    }}
                    onPointerUp={() => setPhotoDragStart(null)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau unggahan lokal, bukan aset build */}
                    <img
                      src={hero.url}
                      alt=""
                      draggable={false}
                      style={{
                        width: "100%", height: 160, objectFit: "cover", display: "block", pointerEvents: "none",
                        objectPosition: `${hero.posX ?? 50}% ${hero.posY ?? 50}%`,
                        transform: `scale(${hero.zoom ?? 1})`,
                        transformOrigin: `${hero.posX ?? 50}% ${hero.posY ?? 50}%`,
                      }}
                    />
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={removePhoto}
                      aria-label="Hapus foto"
                      style={{
                        position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(15,23,42,0.7)", color: "white", border: "none", cursor: "pointer",
                        display: "grid", placeItems: "center",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--d-clr-text-muted)", margin: "0 0 12px" }}>
                    Geser foto untuk atur posisi, pakai slider untuk perbesar/perkecil.
                  </p>
                  <Field label={`Perbesar (${Math.round((hero.zoom ?? 1) * 100)}%)`}>
                    <input
                      type="range"
                      min={100}
                      max={250}
                      value={Math.round((hero.zoom ?? 1) * 100)}
                      onChange={(e) => updateElements({ heroPhoto: { ...hero, zoom: Number(e.target.value) / 100 } })}
                      style={{ width: "100%" }}
                    />
                  </Field>

                  {/* Bentuk (Bulat/Banner/Latar-penuh) sengaja tidak ada
                      pilihan lagi — selalu "Latar penuh". Bulat & Banner
                      dulu ada di sini, tapi keduanya butuh titik sambung
                      foto→latar yang gampang kelihatan seperti garis;
                      "cover" tidak punya batas seperti itu sama sekali,
                      jadi dijadikan satu-satunya pilihan (lihat juga
                      normalizeHeroPhoto di bawah, yang memaksa acara LAMA
                      dengan mode Bulat/Banner ikut jadi Latar-penuh saat
                      dibuka lagi di sini). */}
                  <p style={{ fontSize: 11, color: "var(--d-clr-text-muted)", marginBottom: 14, lineHeight: 1.5 }}>
                    Foto memenuhi satu layar penuh, jadi latar semua konten.
                  </p>

                  <Field label={`Kegelapan overlay (${hero.overlay ?? 90}%)`}>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      value={hero.overlay ?? 90}
                      onChange={(e) => updateElements({ heroPhoto: { ...hero, overlay: Number(e.target.value) } })}
                      style={{ width: "100%" }}
                    />
                  </Field>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="dashboard-btn dashboard-btn-outline dashboard-btn-sm"
                    style={{ width: "100%", marginTop: 4 }}
                  >
                    <ImageIcon size={14} />
                    Ganti foto
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handlePhotoFile(e.target.files?.[0])}
              />
            </>
          );
        })()}

          <div style={{ height: 1, background: "var(--d-clr-border)", margin: "20px 0 16px" }} />

          <Field label={<><Type size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Font judul</>}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {FONT_OPTIONS.map((f) => {
                const active = draft.theme?.fontDisplay === f.fontDisplay;
                return (
                  <button
                    key={f.id}
                    onClick={() => updateTheme({ fontDisplay: f.fontDisplay, canvasFontDisplay: f.canvasFontDisplay })}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      fontSize: 14,
                      cursor: "pointer",
                      fontFamily: f.fontDisplay,
                      border: active ? "1.5px solid var(--d-clr-primary)" : "1.5px solid var(--d-clr-border)",
                      background: active ? "var(--d-clr-primary-light)" : "white",
                      color: active ? "var(--d-clr-primary-dark)" : "var(--d-clr-text)",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </Field>
          </>
        )}

          {/* Link tamu SENGAJA dimatikan dulu (bukan dihapus permanen) —
              diminta eksplisit user, tanpa alasan lebih lanjut yang
              dijelaskan saat itu. State guestUrl/copied/handleCopy masih
              ada apa adanya (dipakai saveState/handleSave), tinggal
              kembalikan blok JSX ini kalau mau dinyalakan lagi. */}
        </div>

        {/* Tombol simpan — sticky, 2 state (§11.8 poin 5). */}
        <div style={{ padding: 20, borderTop: "1px solid var(--d-clr-border)" }}>
          <button
            onClick={handleSave}
            className="dashboard-btn dashboard-btn-press"
            style={{
              width: "100%",
              borderRadius: 100,
              fontWeight: 800,
              fontSize: 15,
              padding: "12px",
              border: "none",
              cursor: "pointer",
              transition: "background 0.3s, color 0.3s",
              background: saveState === "saved" ? "var(--d-clr-success)" : `linear-gradient(135deg, var(--d-clr-primary), var(--d-clr-primary-dark))`,
              color: "white",
            }}
          >
            {saveState === "saved" ? <Check size={16} /> : <Save size={16} />}
            {saveState === "saved" ? "Tersimpan!" : "Simpan Acara"}
          </button>
        </div>
      </div>

      {/* PANEL KANAN — pratinjau langsung */}
      <div
        className="builder-panel-right"
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(#CBD5E1 2px, transparent 2px)",
            backgroundSize: "32px 32px",
            opacity: 0.4,
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 50% 40%, ${accent}, transparent 60%)`,
            opacity: 0.06,
            transition: "background 0.6s",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "#1E293B",
            color: "white",
            borderRadius: 100,
            padding: "8px 20px",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 20,
          }}
        >
          <span
            style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--d-clr-success)", animation: "dashboard-pulse 2s infinite" }}
          />
          {activeTab === "bingkai" ? "Pratinjau Bingkai" : "Live Preview"}
          <button
            onClick={() => setPreviewKey((k) => k + 1)}
            aria-label="Segarkan pratinjau"
            style={{ background: "none", border: "none", cursor: "pointer", color: "white", display: "flex" }}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Pemilih bingkai — cuma muncul kalau ADA lebih dari satu bingkai
            aktif buat dipilih (tidak ada pilihan = tidak perlu pemilih).
            Klik baris bingkai di panel kiri (tab Bingkai) melakukan hal
            yang sama, ini cuma jalan pintas tanpa perlu scroll ke sana. */}
        {activeTab === "bingkai" && pickerFrames.length > 1 && (
          <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: FRAME_EDIT_MAX_W + 80 }}>
            {pickerFrames.map((f) => (
              <button
                key={f.id}
                onClick={() => setPreviewFrameId(f.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: previewFrame?.id === f.id ? "1.5px solid var(--d-clr-primary)" : "1.5px solid var(--d-clr-border)",
                  background: previewFrame?.id === f.id ? "var(--d-clr-primary)" : "white",
                  color: previewFrame?.id === f.id ? "white" : "var(--d-clr-text)",
                }}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        {activeTab === "bingkai" ? (
          // Tab Bingkai — TANPA bezel HP. Yang diedit di sini hasil CETAK
          // bingkainya sendiri, bukan simulasi layar HP tamu, jadi bezel
          // ponsel di sini menyesatkan & cuma mempersempit ruang geser
          // teks. Kartu putih polos, ukurannya ikut FRAME_EDIT_MAX_W/H
          // (lebih leluasa dari MOCKUP_* punya tab Playground).
          <div style={{ position: "relative", zIndex: 1, background: "white", borderRadius: 20, padding: 14, boxShadow: "0 24px 55px rgba(0,0,0,0.18)" }}>
            {previewFrame ? (
              // Editor drag — kotak putus-putus BERISI teks asli (sudah
              // diganti token) di atas tiap layer, bisa digeser langsung
              // di sini, perubahannya tersimpan ke draft.frameTextLayers
              // (lihat setFrameTextLayers).
              <FrameTextEditor
                template={previewFrame}
                layers={getFrameTextLayers(previewFrame)}
                tokens={frameTokens}
                onChangeLayers={(next) => setFrameTextLayers(previewFrame.id, next)}
              />
            ) : (
              <p style={{ fontSize: 12, color: "var(--d-clr-text-muted)", textAlign: "center", padding: 20, width: FRAME_EDIT_MAX_W / 2 }}>
                Belum ada bingkai aktif untuk dipratinjau.
              </p>
            )}
          </div>
        ) : (
          // Tab Playground — bezel HP dipertahankan APA ADANYA (§15.27):
          // konten asli 375×800 di-scale-down, BUKAN versi mini terpisah,
          // supaya pratinjau 100% akurat.
          <div
            className="builder-mockup"
            style={{
              width: MOCKUP_W,
              height: MOCKUP_H,
              background: "#0F172A",
              borderRadius: 42,
              padding: MOCKUP_PADDING,
              border: "4px solid #1E293B",
              boxShadow: "0 28px 60px rgba(0,0,0,0.38)",
              position: "relative",
              flexShrink: 0,
              zIndex: 1,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 6,
                left: "50%",
                transform: "translateX(-50%)",
                width: 85,
                height: 24,
                background: "#0F172A",
                borderRadius: "0 0 16px 16px",
                zIndex: 10,
              }}
            />
            <div style={{ width: "100%", height: "100%", background: "white", borderRadius: 34, overflow: "hidden", position: "relative" }}>
              {/* Skala DIHITUNG, bukan angka tetap 0.66 seperti sebelumnya —
                  0.66 × 375/800 = 247.5×528, padahal kotak putih di dalam
                  bezel ini (280-2×9 padding = 262 × 560-2×9 = 542) lebih
                  besar dari itu. Hasilnya konten nempel rapat cuma di
                  kiri-atas (transformOrigin situ), nyisain celah KOSONG
                  14.5px kanan & 14px bawah — TIDAK SIMETRIS, kelihatan
                  seperti kepotong padahal sebenarnya cuma tidak mengisi
                  penuh. MOCKUP_INNER_W/H harus selalu sinkron dengan
                  (width/height mockup - 2×padding) kalau ukuran bezel ini
                  diubah lagi nanti. */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 375,
                  height: 800,
                  transform: `translate(-50%, -50%) scale(${Math.min(MOCKUP_INNER_W / 375, MOCKUP_INNER_H / 800)})`,
                }}
              >
                <iframe
                  key={previewKey}
                  src="/preview"
                  title="Pratinjau booth"
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
                zIndex: 10,
              }}
            />
          </div>
        )}

        <p style={{ position: "relative", zIndex: 1, marginTop: 16, fontSize: 12, color: "var(--d-clr-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
          <Eye size={13} />
          {activeTab === "bingkai"
            ? previewFrame?.id === VIDEO_CARD_FRAME_ID
              ? "Begini kartu video pesan suara jadinya"
              : "Begini bingkai ini jadinya kalau dicetak"
            : "Begini tampilan layar awal booth untuk tamu"}
        </p>
      </div>
    </div>
  );
}

/** Bulat & Banner dihapus dari pilihan Bentuk (lihat komentar di render
    "Bentuk" di atas) — tapi acara LAMA yang sempat disimpan dengan salah
    satu mode itu tidak otomatis berubah begitu saja di localStorage.
    Dipanggil sekali saat draft dimuat (baik acara baru dari template
    maupun acara existing yang dibuka lewat "Acara Saya") supaya keduanya
    selalu berakhir di "cover" — tidak ada jalan lain foto tampil selain
    Latar-penuh, termasuk untuk acara lama. */
function normalizeHeroPhoto(event: EventConfig): EventConfig {
  const hero = event.theme?.elements?.heroPhoto;
  if (!event.theme || !hero?.url || hero.mode === "cover") return event;
  return {
    ...event,
    theme: {
      ...event.theme,
      elements: {
        ...event.theme.elements,
        heroPhoto: { ...hero, mode: "cover", overlay: hero.overlay ?? 90 },
      },
    },
  };
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="dashboard-label">{label}</label>
      {children}
    </div>
  );
}

/** Pill switch kecil — dipakai buat toggle aktif/nonaktif bingkai katalog.
    Tidak ada komponen toggle umum di codebase ini, dan cuma dipakai satu
    tempat, jadi dibuat inline di sini alih-alih file terpisah. */
/** posX/posY heroPhoto selalu 0-100 (persen) — dipakai drag foto sambutan
    di atas. */
function clampPct(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      style={{
        width: 38, height: 22, borderRadius: 999, border: "none", position: "relative",
        cursor: disabled ? "not-allowed" : "pointer", flexShrink: 0,
        background: checked ? "var(--d-clr-primary)" : "var(--d-clr-border)",
        transition: "background .15s",
      }}
    >
      <span
        style={{
          position: "absolute", top: 2, left: checked ? 18 : 2, width: 18, height: 18, borderRadius: "50%",
          background: "white", transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

/** Pratinjau bingkai LIVE — render sungguhan lewat lib/compositor.ts
    (mesin yang SAMA dipakai StepResult buat hasil foto tamu asli), bukan
    tebakan visual. Foto slot dikosongkan (semua null, lihat komentar di
    compose() bawah) karena belum ada foto sungguhan saat masih di Edit —
    yang ditampilkan cuma bingkai + teks nama/tanggal, itu yang paling
    relevan buat user cek "gaya nulisnya benar apa belum" sebelum coba
    sesi foto sungguhan. Ikut update tiap draft.names/date berubah lewat
    prop `tokens` (dikirim dari draft yang SUDAH di-debounce di Builder,
    supaya tidak render ulang di setiap ketukan huruf). */
function FrameThumb({
  template,
  tokens,
  size = "sm",
}: {
  template: Template;
  tokens: Record<string, string>;
  /** "sm" = baris daftar bingkai (56px, dulu satu-satunya ukuran). "lg" =
      pengisi mockup HP di tab Bingkai — lebih besar & TANPA border/radius
      sendiri (bezel HP-nya yang sudah membulat). */
  size?: "sm" | "lg";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const renderWidth = size === "lg" ? MOCKUP_INNER_W : 260;

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    compose({
      template,
      // null di semua slot = compositor lewati langkah gambar foto ke
      // situ (lihat composeBase di compositor.ts), jadi slotnya tampil
      // kosong (warna `paper` bingkai ini) — bukan error, itu memang
      // perilaku "belum ada foto" yang sudah ada sejak awal untuk kasus
      // lain (retake dll), dipakai ulang di sini apa adanya.
      frames: template.slots.map(() => null),
      filterCss: "none",
      mirror: false,
      tokens,
      scale: Math.min(1, renderWidth / template.width),
    })
      .then((canvas) => {
        if (cancelled) return;
        const target = canvasRef.current;
        if (!target) return;
        target.width = canvas.width;
        target.height = canvas.height;
        target.getContext("2d")?.drawImage(canvas, 0, 0);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [template, tokens, renderWidth]);

  if (size === "lg") {
    if (failed) {
      return <p style={{ fontSize: 12, color: "var(--d-clr-text-muted)", textAlign: "center", padding: 20 }}>Bingkai gagal dimuat.</p>;
    }
    return (
      <canvas
        ref={canvasRef}
        style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", display: "block", borderRadius: 26 }}
      />
    );
  }

  if (failed) {
    return (
      <div style={{ width: 56, height: 56, borderRadius: 8, background: "var(--d-clr-bg)", flexShrink: 0 }} />
    );
  }
  return (
    <canvas
      ref={canvasRef}
      style={{ width: 56, height: "auto", maxHeight: 90, borderRadius: 8, display: "block", flexShrink: 0, border: "1px solid var(--d-clr-border)" }}
    />
  );
}

/** Editor teks bingkai INTERAKTIF — isi mockup HP di tab Edit Bingkai.
    Dasar (foto+overlay PNG, TANPA teks) dirender SEKALI lewat
    composeBase() dan di-cache sebagai data URL — bagian ini yang mahal
    (muat gambar overlay, drawImage berkali-kali). Kotak drag di atasnya
    cuma perlu measureTextLayers() (murni ctx.measureText, murah) supaya
    geser teks terasa responsif tanpa menggambar ulang foto tiap frame.

    measureTextLayers() & drawTextLayer di compositor.ts SUDAH lama
    didesain buat kebutuhan persis ini (lihat komentar TextLayerBounds di
    sana) — dipakai apa adanya di sini, bukan dibuat ulang. */
/** Kotak drag + KONTEN teks asli yang mau ditampilkan di dalamnya —
    gabungan TextLayerBounds (posisi/ukuran kotak, dari measureTextLayers)
    dengan ResolvedTextLayer (baris siap tampil, font, ukuran final
    setelah auto-shrink, dari resolveTextLayer) supaya kotaknya tidak
    kosong lagi seperti sebelumnya. */
type DragBox = TextLayerBounds & {
  lines: string[];
  family: string;
  size: number;
  weight: number;
  tracking: number;
  lineHeight: number;
  italic: boolean;
  color: string;
  align: CanvasTextAlign;
};

function FrameTextEditor({
  template,
  layers,
  tokens,
  onChangeLayers,
}: {
  template: Template;
  layers: TextLayer[];
  tokens: Record<string, string>;
  onChangeLayers: (layers: TextLayer[]) => void;
}) {
  // Dua batas (lebar & tinggi) dipakai bareng — beda dari FrameThumb lama
  // yang cuma mikir lebar — supaya bingkai super-tinggi (mis. lamaran-2/3)
  // tetap muat penuh di kartu "Edit Bingkai" (lihat FRAME_EDIT_MAX_W/H).
  const scale = Math.min(1, FRAME_EDIT_MAX_W / template.width, FRAME_EDIT_MAX_H / template.height);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<DragBox[]>([]);
  // mode "move" = geser posisi (badan kotak). mode "resize" = besar-kecilkan
  // font (handle pojok kanan-bawah) — startSize dipakai HANYA di mode ini,
  // startLayerX/Y HANYA di mode "move" (dua drag berbeda tidak pernah aktif
  // bersamaan, tapi disatukan satu state biar onPointerUp-nya satu jalur).
  const [drag, setDrag] = useState<{
    index: number;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    startLayerX: number;
    startLayerY: number;
    startSize: number;
  } | null>(null);
  // Kotak putus-putus + tombol hapus/resize CUMA tampil untuk teks yang
  // lagi diklik — sebelumnya semua kotak tampil sekaligus terus-menerus,
  // numpuk & saling bertindih kalau teksnya berdekatan (mis. label
  // "ENGAGEMENT" pas di atas "Salma & Faizal"). null = tidak ada yang
  // dipilih, teks tampil polos tanpa kotak.
  const [selected, setSelected] = useState<number | null>(null);
  // Ganti bingkai atau jumlah layer berubah (tambah/hapus) — index lama
  // bisa sudah tidak berlaku lagi, batalkan pilihan supaya tidak nunjuk ke
  // teks yang salah.
  useEffect(() => {
    setSelected(null);
  }, [template.id, layers.length]);

  // Lapisan dasar (foto+overlay) — cuma dirender ulang kalau BINGKAI-nya
  // ganti, BUKAN tiap kali posisi teks digeser (lihat catatan di atas).
  useEffect(() => {
    let cancelled = false;
    composeBase({
      template,
      frames: template.slots.map(() => null),
      filterCss: "none",
      mirror: false,
      scale,
    }).then((canvas) => {
      if (!cancelled) setBaseUrl(canvas.toDataURL("image/png"));
    });
    return () => {
      cancelled = true;
    };
  }, [template, scale]);

  // Kotak drag + isi tekasnya — dihitung ulang tiap layers/tokens berubah
  // (murah, cuma ctx.measureText, TIDAK menggambar apa pun). measureTextLayers
  // & resolveTextLayer dipakai BARENGAN (bukan dihitung ulang sendiri) —
  // sumber sama dengan yang menggambar hasil cetak, supaya kotak dan
  // hasil akhirnya selalu sinkron (lihat catatan di compositor.ts).
  useEffect(() => {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return;
    const bounds = measureTextLayers(ctx, layers, tokens, scale);
    setBoxes(
      bounds.flatMap((b) => {
        const layer = layers[b.index];
        const resolved = resolveTextLayer(ctx, layer, tokens, scale);
        if (!resolved) return [];
        return [{ ...b, lines: resolved.lines, family: resolved.family, size: resolved.size, weight: resolved.weight, tracking: resolved.tracking, lineHeight: resolved.lineHeight, italic: resolved.italic, color: layer.color, align: layer.align }];
      })
    );
  }, [layers, tokens, scale]);

  function startDrag(e: React.PointerEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setSelected(index);
    setDrag({ index, mode: "move", startX: e.clientX, startY: e.clientY, startLayerX: layers[index].x, startLayerY: layers[index].y, startSize: layers[index].size });
  }
  // Handle pojok kanan-bawah — geser MENJAUH (kanan/bawah) memperbesar
  // font, MENDEKAT (kiri/atas) memperkecil. Dipisah dari startDrag supaya
  // tidak ikut memindah posisi teks saat resize (event ini stopPropagation
  // ke kotak induknya).
  function startResize(e: React.PointerEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({ index, mode: "resize", startX: e.clientX, startY: e.clientY, startLayerX: layers[index].x, startLayerY: layers[index].y, startSize: layers[index].size });
  }
  function onMove(e: React.PointerEvent) {
    if (!drag) return;
    if (drag.mode === "move") {
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;
      onChangeLayers(
        layers.map((l, i) => (i === drag.index ? { ...l, x: drag.startLayerX + dx, y: drag.startLayerY + dy } : l))
      );
      return;
    }
    // Resize: rata-rata pergeseran diagonal (dx+dy)/2 dibagi scale, biar
    // menarik ke kanan-bawah ATAU kiri-atas dua-duanya terasa alami sebagai
    // satu gestur "besar-kecilkan" — minimum 8px kanvas biar tidak collapse
    // ke 0/negatif (font hilang).
    const delta = ((e.clientX - drag.startX) + (e.clientY - drag.startY)) / 2 / scale;
    const size = Math.max(8, Math.round(drag.startSize + delta));
    onChangeLayers(layers.map((l, i) => (i === drag.index ? { ...l, size } : l)));
  }

  const w = Math.round(template.width * scale);
  const h = Math.round(template.height * scale);

  return (
    <div
      style={{ position: "relative", width: w, height: h, touchAction: "none" }}
      onPointerMove={onMove}
      onPointerUp={() => setDrag(null)}
      // Klik area KOSONG = batalkan pilihan, teks yang lagi tampil
      // kotaknya balik polos. BUKAN capture — sengaja bubble biasa, supaya
      // klik di kotak/tombol hapus/handle resize (yang masing-masing
      // sudah stopPropagation() di handler-nya sendiri) tidak pernah
      // sampai ke sini dan otomatis membatalkan pilihan yang baru saja
      // dibuat/dipakai (kalau pakai capture, handler ini jalan LEBIH DULU
      // dari milik box — race, sempat bikin tombol hapus & handle resize
      // hilang dari DOM tepat saat mau dipakai).
      onPointerDown={() => setSelected(null)}
    >
      {baseUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- data URL hasil compose(), bukan aset build
        <img src={baseUrl} alt="" style={{ width: w, height: h, display: "block", borderRadius: 14, pointerEvents: "none" }} />
      )}
      {boxes.map((b) => {
        // Kotak minimum 20px biar tetap bisa digenggam kalau teksnya
        // sangat sempit — ditambah SIMETRIS di kedua sisi supaya teks
        // rata-tengah tidak ikut bergeser (lihat komentar measureTextLayers
        // di compositor.ts: x sudah dihitung simetris terhadap titik
        // tengah aslinya untuk align "center").
        const extraW = Math.max(0, 20 - b.w);
        const extraH = Math.max(0, 20 - b.h);
        const isSelected = selected === b.index;
        return (
          <div
            key={b.index}
            onPointerDown={(e) => startDrag(e, b.index)}
            title={isSelected ? "Geser untuk pindah posisi" : "Klik untuk pilih"}
            style={{
              position: "absolute",
              left: b.x - extraW / 2,
              top: b.y - extraH / 2,
              width: b.w + extraW,
              height: b.h + extraH,
              // Kotak putus-putus & latar cuma kelihatan kalau TERPILIH —
              // sebelumnya selalu tampil buat semua teks sekaligus,
              // numpuk kalau teksnya berdekatan (lihat catatan `selected`
              // di atas). Belum terpilih tetap bisa diklik (hit-area sama
              // persis), cuma tidak kelihatan kotaknya.
              border: isSelected ? "1.5px dashed var(--d-clr-primary)" : "1.5px solid transparent",
              background: isSelected ? "rgba(25,118,243,0.08)" : "transparent",
              cursor: !isSelected ? "pointer" : drag?.index === b.index ? "grabbing" : "grab",
              userSelect: "none",
              WebkitUserSelect: "none",
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            {/* Isi teks SUNGGUHAN (token sudah diganti) — sebelumnya kotak
                ini kosong, cuma garis putus-putus tanpa tulisan sama
                sekali, jadi tidak kelihatan seperti apa hasilnya. */}
            <div
              style={{
                width: "100%",
                fontFamily: b.family,
                fontWeight: b.weight,
                fontStyle: b.italic ? "italic" : "normal",
                fontSize: b.size,
                letterSpacing: b.tracking,
                lineHeight: b.lineHeight,
                color: b.color,
                textAlign: b.align,
                whiteSpace: "pre-line",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {b.lines.join("\n")}
            </div>
            {isSelected && (
              <>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onChangeLayers(layers.filter((_, i) => i !== b.index))}
                  aria-label="Hapus teks ini"
                  style={{
                    position: "absolute", top: -9, right: -9, width: 18, height: 18, borderRadius: "50%",
                    background: "#1E293B", color: "white", border: "1.5px solid white", cursor: "pointer",
                    display: "grid", placeItems: "center", padding: 0,
                  }}
                >
                  <X size={9} />
                </button>
                {/* Handle resize — TERPISAH dari badan kotak (yang geser
                    posisi) supaya dua gestur ini tidak saling tabrak. */}
                <div
                  onPointerDown={(e) => startResize(e, b.index)}
                  title="Tarik untuk besar-kecilkan"
                  style={{
                    position: "absolute", bottom: -7, right: -7, width: 14, height: 14, borderRadius: 4,
                    background: "white", border: "1.5px solid var(--d-clr-primary)", cursor: "nwse-resize",
                    touchAction: "none",
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
