import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";

/**
 * Shell dashboard klien — TERPISAH total dari tema booth tamu (dark,
 * per-template). Identitas visual di sini = Circle Snap resmi (navy/blue),
 * lihat app/globals.css §DASHBOARD dan UI-UX-DESIGN-SYSTEM.md §11.2.
 *
 * Belum ada akun/login (lihat lib/dashboard/instances.ts) — semua acara
 * yang dibuat dari sini tersimpan di localStorage browser ini saja.
 */
export const metadata: Metadata = {
  title: "Dashboard — Circle Snap",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
