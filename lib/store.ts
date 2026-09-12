import { create } from "zustand";
import { FILTER_CSS as DEFAULT_FILTER_CSS } from "./filters";
import type { EventConfig, Template } from "./templates";

/**
 * ALUR SESI TAMU
 *
 *   bingkai → potret → suara (opsional) → struk
 *
 * "Pilih bingkai lebih dulu" bukan urutan sembarang: tamu perlu tahu berapa
 * kali akan dijepret sebelum kamera menyala, dan strip di sampingnya sudah
 * menunjukkan bentuk akhir sejak jepretan pertama. Memilih bingkai belakangan
 * membuat sesi terasa seperti mengisi formulir.
 */
export type Step = "bingkai" | "potret" | "suara" | "struk";

/**
 * Nilai bawaan untuk perilaku sesi — dipakai kalau template yang
 * di-attach() tidak mengisi `event.session` sendiri. Tiap template di
 * lib/templates/ dianjurkan mengisi `session` eksplisit; ini murni jaring
 * pengaman.
 */
const DEFAULT_SESSION = {
  countdownSeconds: 3 as const,
  autoContinue: true,
  mirror: true,
  maxRetakes: 3,
  revealMs: 15000,
  filterCss: DEFAULT_FILTER_CSS,
  cameraAspect: "1:1" as const,
  guestNameRequired: true,
};

interface SessionState {
  event: EventConfig | null;
  /** Bingkai yang boleh dipakai template ini, urutan carousel = urutan
      array. Diisi attach() dari PlaygroundTemplate.frames — StepFrame
      membaca dari sini, bukan mengimpor katalog langsung. */
  templates: Template[];
  /** Nama tamu, diisi di layar awal sebelum sesi bisa dimulai. Dipakai
      supaya tuan rumah tahu foto/pesan suara itu dari siapa, dan
      dilampirkan ke kartu video pesan suara. */
  guestName: string;
  step: Step;
  template: Template | null;
  frames: (ImageBitmap | null)[];
  /** Jumlah "ulang" terpakai per slot, sejajar dengan `frames`. */
  retakes: number[];
  cursor: number;
  /** Mirror EFEKTIF saat ini — dibaca StepShoot (preview live & review)
      DAN StepResult/StripCanvas (hasil akhir: unduhan, strip, video).
      Awalnya = preferensi tema (session.mirror), tapi StepShoot memanggil
      setMirror() setiap kali kamera dibalik (lihat komentar di sana) —
      jadi field ini SELALU representasi kamera yang SEDANG aktif, bukan
      preferensi tema statis. Satu sumber ini dibaca semua konsumen supaya
      hasil akhir (foto yang benar-benar diunduh tamu) konsisten dengan apa
      yang mereka lihat di preview, bukan cuma preview-nya yang benar. */
  mirror: boolean;
  /** Preferensi tema ASLI (session.mirror, diisi attach()) — dipakai
      StepShoot untuk tahu harus balik ke mirror APA saat kamera kembali
      ke depan (bukan asumsi selalu true). Tidak pernah diubah setelah
      attach(), beda dari `mirror` di atas yang berubah-ubah ikut kamera. */
  mirrorPreference: boolean;
  countdownFrom: number;
  autoContinue: boolean;
  shooting: boolean;
  voice: Blob | null;
  used: number;
  receipt: string | null;

  /* --- Perilaku sesi, diisi attach() dari EventConfig.session (kalau ada)
     — lihat DEFAULT_SESSION di atas. --- */
  maxRetakes: number;
  revealMs: number;
  filterCss: string;
  cameraAspect: "1:1" | "4:5" | "3:4";
  guestNameRequired: boolean;

  attach: (ev: EventConfig, used: number, templates: Template[]) => void;
  setGuestName: (name: string) => void;
  chooseTemplate: (t: Template) => void;
  goto: (s: Step) => void;
  pushFrame: (bmp: ImageBitmap) => void;
  retakeAt: (index: number) => void;
  canRetake: (index: number) => boolean;
  toggleMirror: () => void;
  setMirror: (v: boolean) => void;
  setCountdown: (n: number) => void;
  toggleAuto: () => void;
  setShooting: (v: boolean) => void;
  setVoice: (b: Blob | null) => void;
  finish: (receipt: string, used: number) => void;
  newSession: () => void;
}

export const useSession = create<SessionState>((set, get) => ({
  event: null,
  templates: [],
  guestName: "",
  step: "bingkai",
  template: null,
  frames: [],
  retakes: [],
  cursor: 0,
  mirror: true,
  mirrorPreference: true,
  countdownFrom: 3,
  autoContinue: true,
  shooting: false,
  voice: null,
  used: 0,
  receipt: null,

  maxRetakes: DEFAULT_SESSION.maxRetakes,
  revealMs: DEFAULT_SESSION.revealMs,
  filterCss: DEFAULT_SESSION.filterCss,
  cameraAspect: DEFAULT_SESSION.cameraAspect,
  guestNameRequired: DEFAULT_SESSION.guestNameRequired,

  attach: (ev, used, templates) => {
    const s = { ...DEFAULT_SESSION, ...ev.session };
    set({
      event: ev,
      templates,
      used,
      countdownFrom: s.countdownSeconds,
      autoContinue: s.autoContinue,
      mirror: s.mirror,
      mirrorPreference: s.mirror,
      maxRetakes: s.maxRetakes,
      revealMs: s.revealMs,
      filterCss: s.filterCss,
      cameraAspect: s.cameraAspect,
      guestNameRequired: s.guestNameRequired,
    });
  },
  // Karakter kontrol (newline dkk. dari paste, bukan spasi biasa) dibuang di
  // sumbernya — nama ini nanti dicetak ke canvas video dan disimpan sebagai
  // JSON, jangan sampai ada yang aneh ikut terbawa dari clipboard tamu.
  // eslint-disable-next-line no-control-regex
  setGuestName: (name) => set({ guestName: name.replace(/[\x00-\x1F\x7F]/g, "").slice(0, 40) }),

  chooseTemplate: (t) =>
    set({
      template: t,
      frames: new Array(t.slots.length).fill(null),
      retakes: new Array(t.slots.length).fill(0),
      cursor: 0,
      step: "potret",
    }),

  goto: (s) => set({ step: s }),

  pushFrame: (bmp) => {
    const { frames, cursor, template } = get();
    if (!template) return;

    const next = [...frames];
    next[cursor] = bmp;

    // Slot kosong berikutnya, bukan cursor + 1 — supaya "ulang foto ke-2"
    // mengisi slot 2 dan tidak menimpa slot 3.
    const empty = next.findIndex((f) => f === null);
    set({ frames: next, cursor: empty === -1 ? cursor : empty });
  },

  retakeAt: (index) => {
    const { frames, retakes, maxRetakes } = get();
    if ((retakes[index] ?? 0) >= maxRetakes) return;

    const nextFrames = [...frames];
    nextFrames[index]?.close?.();
    nextFrames[index] = null;

    const nextRetakes = [...retakes];
    nextRetakes[index] = (nextRetakes[index] ?? 0) + 1;

    set({ frames: nextFrames, retakes: nextRetakes, cursor: index });
  },

  canRetake: (index) => (get().retakes[index] ?? 0) < get().maxRetakes,

  toggleMirror: () => set((s) => ({ mirror: !s.mirror })),
  setMirror: (v) => set({ mirror: v }),
  setCountdown: (n) => set({ countdownFrom: n }),
  toggleAuto: () => set((s) => ({ autoContinue: !s.autoContinue })),
  setShooting: (v) => set({ shooting: v }),
  setVoice: (b) => set({ voice: b }),

  finish: (receipt, used) => set({ receipt, used, step: "struk" }),

  /** Sesi baru untuk tamu berikutnya. Kuota event sengaja tidak direset. */
  newSession: () => {
    get().frames.forEach((f) => f?.close?.());
    set({
      step: "bingkai",
      template: null,
      frames: [],
      retakes: [],
      cursor: 0,
      voice: null,
      receipt: null,
      shooting: false,
    });
  },
}));
