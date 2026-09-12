import { redirect } from "next/navigation";
import Link from "next/link";
import { PLAYGROUND_TEMPLATES } from "@/lib/templates";
import { ChevronRight } from "@/components/icons";

/**
 * Katalog template (root "/") — pengganti pemindai QR untuk playground ini.
 * Statis penuh: daftar template datang langsung dari registry
 * (lib/templates/index.ts), tidak ada fetch, tidak ada database. Klik
 * satu kartu masuk ke sesi tamu sungguhan di /t/<id> (app/t/[id]/page.tsx).
 *
 * Halaman ini SENGAJA tidak memakai tema template mana pun (tidak ada
 * themeVars di sini) — ini ruang netral tempat semua template dipajang
 * berdampingan, bukan pengalaman salah satu template.
 */
export default function Home() {
  // Repo INI (Deddy-Jessica, deploy khusus acara wedding 2026-09-13) —
  // root "/" langsung ke booth wedding, tamu yang scan QR tidak boleh
  // mendarat di dashboard/katalog. Katalog & dashboard TIDAK dihapus (kode
  // playground yang sama, dipakai lagi di repo circle-snap-virtual-
  // photobooth utama) — cuma tidak pernah dicapai selagi redirect ini
  // aktif. Hapus baris ini untuk balikin "/" jadi katalog lagi.
  redirect("/t/wedding");

  return (
    <main className="relative z-10 mx-auto min-h-dvh w-full max-w-5xl px-4 pb-16 pt-14 sm:px-8 sm:pt-20">
      <header className="mb-10 text-center sm:mb-14">
        <p className="tracked font-mono text-[11px] text-smoke">Circle Snap</p>
        <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight text-paper sm:text-4xl">
          Pilih template
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-smoke">
          Setiap kartu di bawah adalah photobooth virtual yang lengkap — bingkai,
          warna, dan font sudah jadi satu paket. Isi acaranya (nama, tanggal,
          tempat) yang nanti bisa diganti, desainnya tetap.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {PLAYGROUND_TEMPLATES.map((tpl) => {
          const theme = tpl.event.theme;
          const swatch = theme
            ? `linear-gradient(135deg, ${theme.brandPurple}, ${theme.flash}, ${theme.brandGold})`
            : undefined;

          return (
            <Link
              key={tpl.id}
              href={`/t/${tpl.id}`}
              className="group block overflow-hidden rounded-3xl ring-1 ring-edge transition hover:ring-flash"
            >
              <div className="h-28 w-full" style={{ background: swatch }} aria-hidden />
              <div className="bg-film px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl tracking-tight text-paper">
                    {tpl.label}
                  </h2>
                  <ChevronRight className="h-4 w-4 shrink-0 text-smoke transition group-hover:translate-x-0.5 group-hover:text-flash" />
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-smoke">{tpl.blurb}</p>
                <p className="tracked mt-3 font-mono text-[10px] text-smoke/70">
                  {tpl.frames.length} bingkai
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="tracked mt-14 text-center font-mono text-[10px] text-smoke/60">
        Playground template — bukan produk jadi
      </p>
    </main>
  );
}
