/**
 * Helper umum lintas dashboard (app/dashboard/**) — mengikuti §16
 * UI-UX-DESIGN-SYSTEM.md.
 *
 * `showToast()` ada supaya pemanggil tidak perlu import react-hot-toast
 * langsung di tiap berkas (satu titik yang tahu detail library toast-nya).
 */
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/** Dipakai untuk konfirmasi netral (bukan sukses/gagal eksplisit). */
export function showToast(message: string): void {
  toast(message);
}

export function showSuccessToast(message: string): void {
  toast.success(message);
}

export function showErrorToast(message: string): void {
  toast.error(message);
}

/** Nilai baru cuma "menetap" ke output setelah `delay`ms tanpa perubahan
    lagi — dipakai Builder (app/dashboard/builder/[templateId]) supaya
    live preview tidak me-remount <EventBooth> di SETIAP ketukan tombol,
    cukup sesaat setelah user berhenti mengetik. */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Baca file foto unggahan (Builder → tab Tampilan, foto sambutan) lalu
 * kecilkan lewat <canvas> sebelum dijadikan data URI — foto asli dari HP
 * bisa beberapa MB, dan ini disimpan APA ADANYA di dalam JSON EventConfig
 * di localStorage (lib/dashboard/instances.ts), yang cuma punya jatah
 * ~5-10MB per origin. Tanpa dikecilkan, satu foto saja bisa menghabiskan
 * jatah itu.
 */
export function readAndCompressImage(file: File, maxDim = 960, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Foto gagal dibaca."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Foto gagal dimuat."));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas 2D tidak tersedia."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
