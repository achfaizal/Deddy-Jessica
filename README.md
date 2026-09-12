# Circle Snap — Playground Template Photobooth

Katalog template photobooth virtual berbasis browser: tiap template = satu
tema/bingkai siap pakai (mis. **Lamaran**). Tamu memindai QR, memilih
bingkai, berfoto, titip pesan suara, lalu unduh strip + video. Semua
statis — tidak ada server, tidak ada database, tidak ada login.

Ini bukan produk jadi, ini **playground**: tempat template baru
dikumpulkan dan diuji sebelum (kalau nanti) dijadikan produk yang benar-
benar dijual. Lihat [CLAUDE.md](CLAUDE.md) untuk aturan kerja & arah ke
depan.

Alur tamu:

```
buka template  →  pilih bingkai  →  sesi foto (+ulang)  →  pesan suara  →  struk & unduh
```

Stack: Next.js 15 (App Router) · TypeScript · Tailwind v4 · Zustand.

---

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3008` — otomatis menampilkan template pertama di
katalog (`lib/templates/index.ts`).

**Kamera dan mikrofon hanya jalan di konteks aman.** `localhost` dihitung
aman. Untuk uji dari HP, `http://192.168.x.x:3008` akan ditolak browser —
pakai tunnel:

```bash
npx localtunnel --port 3008
# atau
cloudflared tunnel --url http://localhost:3008
```

Uji di HP itu wajib. Perilaku `getUserMedia` dan `MediaRecorder` di Safari
iOS dan WebView Android berbeda cukup jauh dari Chrome desktop, dan hampir
semua tamu event datang dari sana.

---

## Struktur

```
app/
  page.tsx                template pertama di katalog (root "/")
  t/[id]/page.tsx          akses langsung per template lewat id-nya
  globals.css              design token + animasi "cuci film"
components/
  EventBooth.tsx           header, kuota, router langkah
  WelcomeScreen.tsx        layar sambutan + nama tamu
  StepFrame.tsx            pilih bingkai
  StepShoot.tsx            kamera, hitung mundur, ulang per slot
  StepVoice.tsx            rekam pesan suara
  StepResult.tsx           struk, unduh, bagikan
  StripCanvas.tsx          preview strip hidup (mesin sama dengan ekspor)
  FrameAssembly.tsx        reveal strip ala "struk keluar dari printer"
lib/
  templates/
    types.ts               semua tipe: EventConfig, EventTheme, Template, dst.
    index.ts                katalog + util (tokensFor, kuota lokal, dst.)
    lamaran.ts               template "Lamaran" (event + 3 bingkai)
  compositor.ts             mesin compositing kanvas
  camera.ts                 getUserMedia + klasifikasi error
  voice.ts                  MediaRecorder audio + meteran level
  video.ts                  kartu video vertikal
  filters.ts                filter untuk preview dan kanvas
  store.ts                  state machine sesi (Zustand)
  copy.ts                   teks antarmuka + override per template
public/templates/<id>/*.png   overlay bingkai, satu folder per template
```

## Menambah template baru

1. Simpan PNG bingkai (RGBA, transparan penuh di area foto — area
   transparan itu yang jadi lubang foto) di `public/templates/<id>/`.
2. Salin pola `lib/templates/lamaran.ts`: satu berkas baru
   `lib/templates/<id>.ts` berisi `event` (identitas + tema) dan `frames`
   (daftar `Template`, koordinat slot dari kanal alpha PNG-nya, bukan
   ditaksir manual).
3. Daftarkan di `PLAYGROUND_TEMPLATES` (`lib/templates/index.ts`).
4. `textLayers` (opsional per bingkai) pakai token `{{names}}` `{{date}}`
   `{{venue}}` `{{hashtag}}` `{{code}}` — kosongkan kalau teks sudah
   tercetak di dalam PNG itu sendiri.

Tidak ada langkah lain. Tidak ada migrasi, tidak ada admin untuk diberi
tahu — satu berkas + satu folder PNG = satu template baru.

---

## Tiga keputusan yang menentukan model bisnisnya (kalau ini jadi produk)

**1. Nama tamu/acara tidak harus dibakar ke dalam PNG.**
Kalau tiap acara butuh file bingkai baru, itu jasa desain, bukan SaaS —
biaya per klien tidak pernah turun. `textLayers` opsional per bingkai
memisahkan "yang berubah per acara" dari "yang tetap" — satu bingkai bisa
melayani banyak acara kalau memang didesain begitu.

**2. Kuota (kalau ada) dipotong per strip, bukan per jepretan.**
Tamu yang mengulang foto tidak boleh menghabiskan paket lebih cepat.
Pemotongan terjadi sekali di layar struk (`StepResult`), dengan penjaga
`useRef` supaya React Strict Mode tidak memotong dua kali di development.

**3. Pesan suara menghasilkan video, bukan file audio terpisah.**
Foto adalah komoditas; suara tamu tidak. Strip dan audio dijahit jadi
video vertikal 1080×1920 lengkap dengan gelombang suara yang berjalan —
langsung di perangkat, tanpa server encoding. Format yang bisa diunggah
apa adanya ke Reels dan TikTok.

---

## Yang sudah berjalan

| | |
|---|---|
| Katalog template statis (satu berkas = satu template) | ✅ |
| Pilih bingkai dari daftar template yang aktif | ✅ |
| Kamera, negosiasi resolusi bertingkat, ganti depan/belakang | ✅ |
| Hitung mundur 0/3/5/10 detik + lanjut otomatis antar-foto | ✅ |
| Ulang foto per slot tanpa mengulang sesi | ✅ |
| Filter warna tetap, konsisten antara preview dan hasil | ✅ |
| Teks acara dinamis di bingkai + penyusutan font otomatis | ✅ |
| Preview strip hidup memakai mesin yang sama dengan ekspor | ✅ |
| Rekam pesan suara + meteran level | ✅ |
| Ekspor video 1080×1920 dengan gelombang suara | ✅ |
| Struk: nomor strip, isi sesi, sisa kuota (lokal) | ✅ |
| Unduh PNG/JPG resolusi cetak, Web Share dengan fallback | ✅ |
| Reduced motion dihormati, fokus keyboard terlihat | ✅ |

## Yang sengaja belum ada

Playground ini murni client-side — semua di bawah ini butuh backend, jadi
sengaja tidak dikerjakan sampai (kalau) ada keputusan untuk membangun
produknya sungguhan:

- Backend, autentikasi, dashboard admin
- Kuota yang benar-benar menegakkan lintas perangkat (sekarang cuma
  localStorage per HP — lihat catatan di `lib/templates/index.ts`)
- Katalog template multi-halaman (sekarang cuma root "/" + `/t/[id]`)
- Upload cloud, galeri event, unduh massal untuk panitia
- Generator QR (di playground, halaman depan menggantikan pemindai)
- Antrean offline (IndexedDB + Background Sync)
- Moderasi konten, watermark sponsor, GIF/boomerang
- Billing dan pembelian paket

---

## Catatan kompatibilitas

`MediaRecorder` untuk video memilih MIME yang didukung secara berurutan:
MP4 lebih dulu (Safari modern), lalu WebM VP9/VP8. Di browser tanpa
dukungan sama sekali, tombol video tidak muncul dan unduhan foto tetap
berjalan normal. `ctx.filter` absen di sebagian WebView lama — foto tetap
tersusun, hanya tanpa filter. Pola yang dipakai di seluruh kode: gagal
pelan, jangan gagal total.
