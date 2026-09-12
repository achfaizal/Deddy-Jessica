# CLAUDE.md — Circle Snap Playground

Berkas ini dibaca otomatis setiap sesi. Isinya mengikat.

---

## 1. Apa ini

Playground template photobooth virtual: kumpulan template siap pakai
(tema + bingkai + alur tamu lengkap), semuanya statis — tidak ada
database, tidak ada login, tidak ada server. Satu template = satu berkas
di `lib/templates/` + satu folder PNG di `public/templates/`.

**Ini bukan produk jadi.** Tujuannya sekarang: kumpulkan sebanyak mungkin
template yang bekerja dan enak dipakai. Kalau nanti ada keputusan untuk
menjadikan ini produk yang dijual (orang bisa "beli" virtual photobooth),
itu tahap terpisah yang butuh perencanaan sendiri — jangan diam-diam mulai
membangun backend/pembayaran/admin di tengah kerja menambah template,
tanya dulu.

Lihat [README.md](README.md) untuk cara menjalankan dan cara menambah
template baru.

---

## 2. Riwayat penting

Repo ini pernah berkembang jadi CMS penuh (portal admin, akun klien,
Postgres, billing, orders, staff) di riwayat git-nya. Semua itu **sengaja
dicabut** (2026-08-18) untuk kembali ke playground statis murni — kodenya
sudah dibangun terlalu jauh ke arah SaaS sebelum arah produknya sendiri
jelas. Kalau butuh melihat bagaimana itu diimplementasikan dulu, ada di
git history (branch lain / commit sebelum pencabutan), bukan didesain
ulang dari nol.

**Jangan menambahkan kembali:** login/auth, database, endpoint `/api/*`,
upload cloud, sistem pembayaran — kecuali diminta eksplisit, karena itu
tandanya arah produk sudah diputuskan dan perlu perencanaan sendiri (lihat
§1).

**Pengecualian yang sudah diminta eksplisit (2026-09-13):** `app/api/moments/*`
+ `lib/moments.ts` (Vercel Blob di production, folder lokal saat dev) —
diporting RINGKAS dari project glyka-virtual-photobooth (TANPA Postgres,
listing dibaca langsung dari Blob API/filesystem, bukan tabel) supaya
galeri "Momen" tersimpan bersama lintas HP tamu untuk acara wedding.ts
sungguhan. Ini bukan izin diam-diam menambah endpoint lain — tetap tanya
dulu untuk `/api/*` di luar `moments/*` ini.

---

## 3. Cara kerja

### Sebelum menulis kode

1. Kalau tugasnya "tambah template baru": ikuti pola di README §"Menambah
   template baru" — tidak perlu izin, itu memang tujuan playground ini.
2. Kalau tugasnya menyentuh struktur (lib/templates/types.ts, EventBooth,
   store, compositor) atau menambah dependency/backend baru: sampaikan
   rencana singkat dulu (file apa yang disentuh, apa yang tidak
   dikerjakan), tunggu konfirmasi.

### Saat mengerjakan

- Satu template = satu berkas (`lib/templates/<id>.ts`) + satu folder PNG
  (`public/templates/<id>/`). Jangan pecah satu template ke banyak
  berkas kecil — itu yang membuat "tambah template" jadi mahal.
- Kalau menemukan template lama (git history) yang bisa dipakai ulang,
  bilang dulu sebelum menghidupkannya kembali — mungkin asetnya sudah
  tidak relevan.

### Setelah selesai

- Jalankan `npx tsc --noEmit` dan `npm run build`
- Laporkan apa yang **belum** dikerjakan, bukan hanya yang sudah
- Jangan klaim sesuatu berfungsi kalau belum dijalankan sungguhan

---

## 4. Aturan yang tidak boleh dilanggar

**Bingkai (PNG overlay) tidak boleh memuat teks yang berubah per acara.**
Nama, tanggal, tempat, tagar didefinisikan sebagai `textLayers`
(`lib/templates/types.ts`) dan digambar saat compositing dari data event —
supaya satu bingkai bisa dipakai ulang lintas acara kalau memang didesain
begitu. (Boleh dilanggar sengaja per-bingkai kalau memang bingkainya
dirancang khusus satu acara — kosongkan `textLayers` di kasus itu, jangan
setengah-setengah.)

**`filterCss` satu string dipakai di dua tempat** — `style.filter` pada
`<video>` dan `ctx.filter` saat compositing (`lib/compositor.ts`). Kalau
dipisah, hasil unduhan beda dengan yang dilihat tamu.

**Gagal pelan, jangan gagal total.** `ctx.filter` absen di WebView lama →
foto tetap tersusun tanpa filter. Overlay gagal dimuat → foto tamu tidak
hilang. `MediaRecorder` tidak didukung → tombol video tidak muncul, unduh
foto tetap jalan.

**Kuota (`lib/templates/index.ts`) murni localStorage per perangkat.**
Ini demonstrasi perilaku "paket habis", bukan penegakan sungguhan — dua
tamu di dua HP sama-sama mulai dari 0. Jangan berpura-pura ini
server-authoritative di kode atau di teks yang dilihat tamu.

**Menambah font baru wajib 3 langkah sinkron** (lihat komentar di
`app/layout.tsx`): impor lewat `next/font`, ekspos `--canvas-font-<id>` di
`<html>`, isi `fontDisplay` **dan** `canvasFontDisplay` di tema template.
Lupa salah satu = teks di layar beda font dengan hasil unduhan.

---

## 5. Stack & konvensi

| | |
|---|---|
| Framework | Next.js 15 App Router |
| Bahasa | TypeScript, `strict: true` |
| Styling | Tailwind v4 |
| State | Zustand |
| Bahasa antarmuka | **Bahasa Indonesia** — semua label, pesan error, teks kosong |

### Kode

- Komentar menjelaskan **kenapa**, bukan apa. Kalau komentarnya hanya
  mengulang kode, hapus.
- Nama variabel dan fungsi boleh Inggris; teks yang dilihat pengguna wajib
  Indonesia.
- Tidak ada `any`. Kalau terpaksa, beri komentar alasannya.
- Pesan error ditulis untuk pengguna, bukan developer. Sebutkan apa yang
  terjadi dan langkah berikutnya.

### Git

- Pesan commit Bahasa Indonesia, imperatif: "Tambah template Wedding Klasik"
- **Jangan pernah menambahkan `Co-Authored-By` atau atribusi apa pun**
- Satu commit = satu perubahan yang masuk akal berdiri sendiri

---

## 6. Larangan

- Menambah dependensi tanpa bertanya dulu
- Database, login, atau endpoint `/api/*` tanpa diminta eksplisit (§2)
- Menulis nama tamu/acara langsung ke dalam berkas PNG bingkai
- Mengarang aturan bisnis (harga paket, kuota) — kalau belum ada
  keputusannya, tanya, jangan pilih sendiri lalu lanjut

---

## 7. Selesai artinya

- [ ] `npx tsc --noEmit` bersih
- [ ] `npm run build` lolos
- [ ] Kondisi kosong dan kondisi gagal punya tampilan sendiri
- [ ] Teks pengguna Bahasa Indonesia
- [ ] Kalau menyentuh booth: diuji di viewport 390px
- [ ] Yang belum dikerjakan dilaporkan terus terang
