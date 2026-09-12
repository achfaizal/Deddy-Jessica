"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import EventBooth from "@/components/EventBooth";
import { getInstance, type EventInstance } from "@/lib/dashboard/instances";
import { getTemplate } from "@/lib/templates";

/**
 * Akses tamu ke acara hasil Builder (beda dari /t/[id] yang selalu
 * menampilkan template BAWAAN apa adanya). "use client" wajib di sini —
 * instance-nya hidup di localStorage (lib/dashboard/instances.ts), yang
 * cuma bisa dibaca di browser, tidak bisa diresolusi di server component
 * seperti app/t/[id]/page.tsx.
 *
 * Bingkai dipinjam APA ADANYA dari template asal (belum ada fitur
 * pilih/upload bingkai sendiri — itu Tahap 3 Builder) — cukup untuk
 * Tahap 2: ganti nama/tanggal/venue/dst, bingkai tetap ikut template.
 */
export default function InstancePage() {
  const params = useParams<{ id: string }>();
  const [instance, setInstance] = useState<EventInstance | null | undefined>(undefined);

  useEffect(() => {
    setInstance(getInstance(params.id) ?? null);
  }, [params.id]);

  if (instance === undefined) return null; // sekejap sebelum localStorage sempat dibaca
  if (instance === null) notFound();

  const tpl = getTemplate(instance.templateId);
  if (!tpl) notFound(); // template asalnya sudah tidak ada di katalog

  return <EventBooth event={instance.event} templates={tpl.frames} />;
}
