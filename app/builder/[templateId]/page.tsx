"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, notFound } from "next/navigation";
import Builder from "@/components/dashboard/Builder";
import { getInstance, type EventInstance } from "@/lib/dashboard/instances";
import { getTemplate } from "@/lib/templates";

/**
 * "use client" wajib — kalau ?instance=<id> terisi (edit acara yang sudah
 * ada dari "Acara Saya"), instance-nya cuma bisa dibaca dari localStorage
 * di browser (lib/dashboard/instances.ts), sama seperti app/e/[id].
 */
export default function BuilderPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instance") ?? undefined;

  const [loaded, setLoaded] = useState(false);
  const [instance, setInstance] = useState<EventInstance | undefined>(undefined);

  useEffect(() => {
    setInstance(instanceId ? getInstance(instanceId) : undefined);
    setLoaded(true);
  }, [instanceId]);

  const template = getTemplate(templateId);
  if (!template) notFound();
  if (!loaded) return null;
  // instance-nya diminta lewat ?instance= tapi tidak ketemu (mis. sudah
  // dihapus, atau localStorage browser lain) — gagal jelas, bukan diam-
  // diam mulai dari template kosong seolah acara itu tidak pernah ada.
  if (instanceId && !instance) notFound();

  return <Builder template={template} instanceId={instance?.id} initialEvent={instance?.event} />;
}
