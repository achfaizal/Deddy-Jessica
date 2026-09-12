"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, CalendarDays, Menu, X } from "@/components/icons";

/** Dua tujuan saja sekarang (§11.2 UI-UX-DESIGN-SYSTEM.md) — cukup buat
    nav flat, belum perlu label section "Menu"/"Pengaturan" berlapis.
    Urutan & label diminta eksplisit: "Pilih Template" duluan (mulai dari
    situ), baru "Visual Builder" (bekas label "Acara Saya" — halaman yang
    sama, /dashboard, isinya daftar acara tersimpan yang bisa dibuka lagi
    ke Builder). */
const NAV = [
  { href: "/dashboard/templates", label: "Pilih Template", icon: LayoutGrid },
  { href: "/dashboard", label: "Visual Builder", icon: CalendarDays },
];

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <>
      <div style={{ padding: "24px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--d-clr-brand-1), var(--d-clr-brand-2))",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontWeight: 900,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            C
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: "var(--d-clr-primary)" }}>
            Circle Snap
          </span>
        </div>
        {/* Belum ada akun (lihat lib/dashboard/instances.ts) — catatan kecil
            ini menggantikan kartu ringkasan konteks §11.2 poin 2, supaya
            jelas kenapa tidak ada nama user di footer sidebar. */}
        <div
          style={{
            borderRadius: 12,
            padding: "10px 12px",
            background: "var(--d-clr-primary-light)",
            border: "1px solid rgba(25,118,243,0.2)",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 13, color: "var(--d-clr-primary-dark)", margin: 0 }}>
            Mode Percobaan
          </p>
          <p style={{ fontSize: 11, color: "var(--d-clr-text-muted)", margin: "2px 0 0" }}>
            Acara tersimpan di browser ini saja
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--d-clr-border)", margin: "0 20px" }} />

      <nav style={{ padding: "16px 12px", flex: 1, overflowY: "auto" }}>
        <p
          className="tracked"
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--d-clr-text-muted)",
            padding: "0 8px",
            marginBottom: 8,
          }}
        >
          Menu
        </p>
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <motion.div key={item.href} whileHover={{ x: 3 }}>
              <Link
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 12,
                  marginBottom: 4,
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--d-clr-primary)" : "var(--d-clr-text-muted)",
                  background: active ? "rgba(25,118,243,0.12)" : "transparent",
                  border: active ? "1.5px solid rgba(25,118,243,0.28)" : "1.5px solid transparent",
                  textDecoration: "none",
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pageLabel = NAV.find((n) => n.href === pathname)?.label ?? "Dashboard";

  return (
    // position:relative + z-10 WAJIB di sini — app/layout.tsx (dipakai
    // SEMUA route termasuk /dashboard) menaruh 3 blob dekoratif ambient
    // punya booth (position:fixed, z-0) sebagai saudara sebelum {children}.
    // Tanpa positioning eksplisit, div statis di sini dilukis DI BAWAH
    // blob itu dalam urutan stacking CSS (elemen in-flow non-positioned
    // selalu kalah dari sibling positioned ber-z-index, walau z-index-nya
    // cuma 0) — persis pola yang sama dipakai app/page.tsx (katalog tamu)
    // untuk alasan yang sama.
    <div className="dashboard-root" style={{ position: "relative", zIndex: 10, display: "flex", minHeight: "100vh" }}>
      {/* Sidebar desktop — disembunyikan di mobile lewat CSS (§11.2: class
          toggle, bukan inline media query, supaya breakpoint 768px satu
          sumber kebenaran di globals.css). */}
      <div
        className="dashboard-sidebar-desktop"
        style={{
          width: 260,
          flexShrink: 0,
          borderRight: "1px solid var(--d-clr-border)",
          background: "var(--d-clr-surface)",
        }}
      >
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
          <Sidebar pathname={pathname} />
        </div>
      </div>

      {/* Drawer mobile */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.5)" }}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: 260,
                zIndex: 210,
                background: "var(--d-clr-surface)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Tutup menu"
                style={{
                  position: "absolute",
                  top: 16,
                  right: -44,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--d-clr-surface)",
                  border: "none",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
              <Sidebar pathname={pathname} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          className="dashboard-topbar"
          style={{
            height: 60,
            backdropFilter: "blur(20px)",
            background: "rgba(244,248,255,0.85)",
            borderBottom: "1px solid var(--d-clr-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu"
              className="dashboard-hamburger"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--d-clr-text)" }}
            >
              <Menu size={20} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--d-clr-text)" }}>{pageLabel}</span>
          </div>
          <Link
            href="/"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--d-clr-text-muted)", textDecoration: "none" }}
          >
            Lihat sebagai tamu →
          </Link>
        </div>

        <div style={{ flex: 1, padding: "28px", overflow: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
