/**
 * DETEKSI SLOT OTOMATIS DARI BINGKAI PNG TRANSPARAN
 *
 * User (lewat Builder → Bingkai → "Upload bingkai sendiri") mengunggah PNG
 * bingkai dengan lubang transparan di tempat foto akan ditempel. Fungsi di
 * sini membaca pixel alpha-nya, mengelompokkan area transparan yang saling
 * bersambung (connected-component labeling — flood fill iteratif, BUKAN
 * rekursif, supaya tidak stack-overflow di gambar besar), lalu mengubah
 * tiap kelompok jadi satu `Slot` (kotak pembungkus/bounding box).
 *
 * Hasilnya CUMA titik awal — Builder menampilkannya sebagai kotak yang
 * bisa digeser/di-resize manual sebelum dipakai (lihat FrameEditor.tsx),
 * karena deteksi otomatis bisa saja meleset (lubang tidak persegi, terlalu
 * kecil, saling menempel, dll).
 */
import type { Slot } from "./templates";

export interface DetectedFrame {
  /** Ukuran kanvas kerja SETELAH dikecilkan (lihat maxDim) — inilah yang
      dipakai sebagai Template.width/height, BUKAN ukuran asli file. */
  width: number;
  height: number;
  /** Data URI PNG pada ukuran kanvas kerja — dipakai sebagai `overlay`. */
  overlay: string;
  slots: Slot[];
}

/** Alpha di bawah ini dianggap "lubang" (transparan). Bukan 0 murni —
    tepi hasil anti-aliasing PNG biasanya punya alpha 1-20-an, bukan
    persis 0, jadi ambang agak longgar supaya tepi ikut terhitung sebagai
    bagian lubang, bukan solid. */
const ALPHA_HOLE_THRESHOLD = 24;

/** Blob transparan lebih kecil dari ini (dalam pixel²) diabaikan — noise
    kompresi PNG atau titik transparan liar, bukan slot foto sungguhan. */
const MIN_BLOB_AREA_RATIO = 0.004; // 0.4% dari luas kanvas

/** Batas jumlah slot — bingkai dengan puluhan lubang kecil (mis. hasil
    kompresi PNG yang berantakan) tetap dibatasi supaya UI koreksi manual
    di FrameEditor tidak meluber. */
const MAX_SLOTS = 8;

export async function detectFrameSlots(file: File, maxDim = 1080): Promise<DetectedFrame> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak tersedia.");
  ctx.drawImage(img, 0, 0, width, height);

  const { data } = ctx.getImageData(0, 0, width, height);
  const slots = findTransparentBlobs(data, width, height);

  return { width, height, overlay: canvas.toDataURL("image/png"), slots };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File gagal dibaca."));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar gagal dimuat."));
    img.src = src;
  });
}

/**
 * Connected-component labeling di atas mask alpha, pakai flood fill
 * iteratif (stack eksplisit, bukan panggilan fungsi rekursif) — gambar
 * 1080×1440 itu ~1.5 juta pixel, rekursi sedalam itu akan meledakkan call
 * stack JS di semua browser.
 */
function findTransparentBlobs(data: Uint8ClampedArray, width: number, height: number): Slot[] {
  const visited = new Uint8Array(width * height);
  const isHole = (i: number) => data[i * 4 + 3] < ALPHA_HOLE_THRESHOLD;
  const minArea = width * height * MIN_BLOB_AREA_RATIO;

  const boxes: Slot[] = [];
  const stack: number[] = [];

  for (let start = 0; start < width * height; start++) {
    if (visited[start] || !isHole(start)) continue;

    let minX = width, minY = height, maxX = 0, maxY = 0, area = 0;
    stack.push(start);
    visited[start] = 1;

    while (stack.length > 0) {
      const i = stack.pop()!;
      const x = i % width;
      const y = (i / width) | 0;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      // 4-arah cukup — 8-arah (diagonal) gampang menyatukan dua lubang
      // yang cuma bersentuhan di ujung, jadi satu slot raksasa yang salah.
      const neighbors = [
        x > 0 ? i - 1 : -1,
        x < width - 1 ? i + 1 : -1,
        y > 0 ? i - width : -1,
        y < height - 1 ? i + width : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && !visited[n] && isHole(n)) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }

    if (area >= minArea) {
      boxes.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
    }
  }

  // Urutan baca alami (atas-ke-bawah, lalu kiri-ke-kanan) — begitu juga
  // urutan slot diisi tamu saat sesi foto, supaya terasa wajar.
  boxes.sort((a, b) => a.y - b.y || a.x - b.x);
  return boxes.slice(0, MAX_SLOTS);
}
