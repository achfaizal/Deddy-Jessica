"use client";

import { useParams, notFound } from "next/navigation";
import EventBooth from "@/components/EventBooth";
import { getTemplate } from "@/lib/templates";

/** Akses langsung per template lewat id-nya (lib/templates/index.ts),
    dipakai kalau katalog sudah lebih dari satu template dan root "/"
    tidak lagi cukup. Statis penuh, sama seperti app/page.tsx.

    JUGA dipakai sebagai sumber pratinjau "coba dulu" — iframe mockup HP
    di kartu /dashboard/templates & modal Preview-nya sama-sama nunjuk ke
    sini. Makanya bingkai yang punya `showcaseOverlay` (PNG versi "sudah
    jadi", mis. ENG1.png "Sal & Sal") dipakai DI SINI SAJA, bukan overlay
    dinamis (`overlay`, -token.png + textLayers) yang dipakai Builder/sesi
    tamu asli — calon user lihat contoh hasil jadi yang rapi dulu,
    textLayers dikosongkan sekalian karena tulisannya sudah menyatu di
    gambar (gambar ulang teksnya lagi di atas cuma bikin dobel/bertindih).
    Bingkai tanpa showcaseOverlay (belum ada versi baked-nya) apa adanya —
    fallback ke overlay dinamis seperti biasa (atau ke `ornament`, kalau
    bingkainya digambar lewat kode bukan PNG sama sekali — lihat
    Template.ornament di types.ts, dipakai wedding.ts dkk). Kartu video
    pesan suara (theme.videoBg) sama polanya — showcase pakai
    videoBgShowcase (baked) + videoTextOnBg dimatikan, bukan videoBg token
    + teks dinamis.

    "use client" WAJIB (bukan server component seperti sebelumnya) —
    Template.ornament adalah FUNGSI (lihat types.ts), dan React Server
    Component tidak boleh mengoper fungsi sebagai prop ke Client Component
    ("Functions cannot be passed directly to Client Components" — bug
    nyata yang ditemukan lewat log server, bukan dugaan). Pola sama
    dengan app/e/[id] & app/builder/[templateId] yang sudah client
    duluan. */
export default function TemplatePage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const tpl = getTemplate(id);
  if (!tpl) notFound();

  const showcaseFrames = tpl.frames.map((f) =>
    f.showcaseOverlay ? { ...f, overlay: f.showcaseOverlay, textLayers: [] } : f
  );
  const showcaseEvent = tpl.event.theme?.videoBgShowcase
    ? {
        ...tpl.event,
        theme: { ...tpl.event.theme, videoBg: tpl.event.theme.videoBgShowcase, videoTextOnBg: false },
      }
    : tpl.event;

  return <EventBooth event={showcaseEvent} templates={showcaseFrames} />;
}
