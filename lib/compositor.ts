import type { Slot, Template, TextLayer } from "./templates";

/**
 * MESIN COMPOSITING
 *
 * Frame mentah disimpan seukuran sensor; crop, filter, dan teks dihitung saat
 * compose. Konsekuensinya tamu bisa ganti template atau filter SETELAH
 * memotret tanpa foto ulang, dan seluruh biaya render tetap nol di server.
 *
 * Urutan menggambar: kertas → foto → overlay PNG → teks event.
 * Teks digambar terakhir supaya nama pengantin tidak pernah tertutup bingkai.
 */

const overlayCache = new Map<string, HTMLImageElement>();

function loadOverlay(src: string): Promise<HTMLImageElement> {
  const cached = overlayCache.get(src);
  if (cached?.complete) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      overlayCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Overlay tidak bisa dimuat: ${src}`));
    img.src = src;
  });
}

/** Nama family asli dari next/font, dibaca dari custom property di <html>. */
function familyFor(face: "display" | "mono"): string {
  if (typeof window === "undefined") return "sans-serif";
  const prop = face === "mono" ? "--canvas-mono" : "--canvas-display";
  const v = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  return v || (face === "mono" ? "monospace" : "sans-serif");
}

export function coverRect(srcW: number, srcH: number, slot: Slot) {
  const slotAspect = slot.w / slot.h;
  const srcAspect = srcW / srcH;

  if (srcAspect > slotAspect) {
    const sh = srcH;
    const sw = sh * slotAspect;
    return { sx: (srcW - sw) / 2, sy: 0, sw, sh };
  }
  const sw = srcW;
  const sh = sw / slotAspect;
  return { sx: 0, sy: (srcH - sh) / 2, sw, sh };
}

/**
 * PRIMITIF ORNAMEN — dipakai bareng oleh template yang gambar bingkainya
 * lewat kode (Template.ornament, lihat types.ts) alih-alih PNG. Diletakkan
 * di sini (mesin compositing), bukan diketik ulang di tiap berkas
 * template, karena ini murni matematika gambar generik (trigonometri arc,
 * bentuk belah ketupat) — bukan keputusan desain satu template tertentu.
 * Tiap primitif menerima warna/ukuran dari pemanggilnya, jadi 4 template
 * beda bisa hasilkan tampilan yang beda total cuma dari parameter & posisi
 * yang beda, bukan salin-tempel logika.
 */

/** Busur "tandai radial" — segaris tanda pendek memancar dari titik pusat
    sepanjang busur, ditutup satu garis lengkung di ujung dalamnya. Dasar
    dari efek karangan bunga geometris (busur pendek, tanda rapat) MAUPUN
    ledakan sinar ulang tahun (busur lebar, tanda jarang & panjang) —
    beda tampilan cuma dari parameter sudut/jumlah/panjang. */
export function tickArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  count: number,
  tickLen: number,
  color: string,
  lineWidth: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  for (let i = 0; i <= count; i++) {
    const a = a0 + (a1 - a0) * (i / count);
    const x0 = cx + Math.cos(a) * r;
    const y0 = cy + Math.sin(a) * r;
    const x1 = cx + Math.cos(a) * (r + tickLen);
    const y1 = cy + Math.sin(a) * (r + tickLen);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a1);
  ctx.stroke();
}

/** Belah ketupat kecil — aksen titik dekoratif (bukan bulat/kotak polos),
    dipakai sebagai penanda di ujung garis atau pengisi ruang kosong. */
export function diamondMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size, cy);
  ctx.closePath();
  ctx.fill();
}

/** Siku sudut — dua garis membentuk "L" di satu pojok, penanda bingkai
    modern/geometris (beda dari tickArc yang melengkung). `dx`/`dy` ±1
    menentukan arah siku menghadap ke mana (pojok mana). */
export function cornerBracket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  dx: 1 | -1,
  dy: 1 | -1,
  color: string,
  lineWidth: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(x + size * dx, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + size * dy);
  ctx.stroke();
}

/** Satu kelopak (teardrop) — bentuk dasar `petalCluster` di bawah, jarang
    dipakai sendirian. Digambar dari pusat (0,0) menghadap sumbu-x positif
    lalu diputar/digeser oleh pemanggil (ctx.translate+rotate), supaya
    satu bentuk dasar bisa dipakai berkali-kali dari sudut mana pun tanpa
    menghitung ulang koordinatnya. */
function petal(ctx: CanvasRenderingContext2D, length: number, width: number, color: string, alpha: number) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.35, -width, length, 0);
  ctx.quadraticCurveTo(length * 0.35, width, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Rumpun kelopak — BEDA dari tickArc (garis lurus memancar): ini bentuk
    kelopak SUNGGUHAN (melengkung, ada isi/fill, bukan cuma garis),
    ditumpuk beberapa lapis ukuran & opacity beda supaya terasa "rimbun"
    seperti buket bunga sungguhan, bukan pola geometris tipis. Inilah
    yang dipakai menggantikan tickArc polos di bingkai wedding/birthday
    supaya ornamennya terasa lebih padat/mewah (diminta eksplisit —
    "ornamen bingkai masih tipis/sepi"). `petalCount` kelopak tersebar
    rata sekeliling 360°, DIULANG 2 lapis (dalam pendek+lebar, luar
    panjang+ramping) supaya ada kedalaman, bukan satu lapis rata. */
export function petalCluster(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerLen: number,
  petalCount: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  // Lapis luar — kelopak panjang & ramping, opacity lebih rendah (kesan
  // "menjauh"/latar).
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    petal(ctx, outerLen, outerLen * 0.22, color, 0.55);
    ctx.restore();
  }
  // Lapis dalam — kelopak pendek & lebar, opacity penuh, diputar setengah
  // selisih sudut supaya menyelip DI ANTARA kelopak luar (bukan menumpuk
  // pas di atasnya) — ini yang bikin rumpunnya kelihatan rapat/berlapis.
  const innerCount = Math.max(3, Math.round(petalCount * 0.6));
  for (let i = 0; i < innerCount; i++) {
    const angle = (i / innerCount) * Math.PI * 2 + Math.PI / innerCount;
    ctx.save();
    ctx.rotate(angle);
    petal(ctx, outerLen * 0.58, outerLen * 0.26, color, 0.9);
    ctx.restore();
  }
  // Titik pusat — tutup pangkal kelopak, biar tidak ada celah kosong di
  // tengah rumpun.
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, outerLen * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Garis sulur — lengkung halus (bukan garis lurus) MELALUI titik-titik
    yang diberikan, dengan tanda kecil (daun) bercabang gantian kiri-kanan
    sepanjang garisnya. Dipakai sebagai pengganti garis pembatas polos —
    jauh lebih "hidup" untuk kesan undangan digital, tetap murni kode. */
export function vineLine(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  leafEvery: number,
  leafSize: number,
  color: string,
  lineWidth: number
) {
  if (points.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.stroke();

  // Daun kecil bercabang — dihitung dari arah garis di titik itu, gantian
  // menghadap kiri lalu kanan supaya simetris sepanjang sulur.
  let leafI = 0;
  for (let i = 1; i < points.length - 1; i += leafEvery) {
    const [px, py] = points[i];
    const [nx, ny] = points[Math.min(i + 1, points.length - 1)];
    const dirAngle = Math.atan2(ny - py, nx - px);
    const side = leafI % 2 === 0 ? 1 : -1;
    leafI++;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(dirAngle + (Math.PI / 2.6) * side);
    petal(ctx, leafSize, leafSize * 0.34, color, 0.8);
    ctx.restore();
  }
}

/** Garis manik — deretan titik kecil berjarak rata di sepanjang satu
    garis lurus, pengganti garis solid polos untuk border sekunder yang
    lebih detail/bertekstur. */
export function beadedRule(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  spacing: number,
  dotSize: number,
  color: string
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.round(len / spacing));
  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    ctx.beginPath();
    ctx.arc(x0 + dx * t, y0 + dy * t, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function fill(tpl: string, tokens: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? "");
}

function measure(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  return ctx.measureText(text).width + tracking * Math.max(text.length - 1, 0);
}

function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  align: CanvasTextAlign,
  tracking: number
) {
  if (tracking === 0) {
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    return;
  }
  const total = measure(ctx, text, tracking);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  ctx.textAlign = "left";
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
}

/**
 * Menghitung ukuran font FINAL (setelah auto-shrink) dan baris-baris teks
 * siap gambar untuk satu layer — dipakai BERSAMA oleh `drawTextLayer` dan
 * `measureTextLayers`. Kalau dua-duanya menghitung ukurannya sendiri-
 * sendiri, cepat atau lambat hasilnya beda (handle drag di editor tidak
 * lagi menempel pas di teks yang sungguhan tercetak). Lihat
 * docs/blueprint/07-canvas-designer.md §3.
 *
 * ctx dipakai HANYA untuk ctx.measureText — tidak menggambar apa pun,
 * jadi aman dipanggil berkali-kali saat menghitung tata letak.
 */
export interface ResolvedTextLayer {
  lines: string[];
  size: number;
  family: string;
  weight: number;
  tracking: number;
  lineHeight: number;
  italic: boolean;
}

/** Satu-satunya tempat merangkai string `ctx.font` — dipakai di TIGA
    tempat (resolveTextLayer, drawTextLayer, measureTextLayers). Kalau
    masing-masing merangkai sendiri-sendiri, gampang salah satu lupa
    ditambah "italic " dan hasilnya beda dari yang lain (sama seperti
    alasan resolveTextLayer dipakai bareng, lihat komentar di atasnya). */
function fontString(weight: number, size: number, family: string, italic: boolean): string {
  return `${italic ? "italic " : ""}${weight} ${size}px ${family}`;
}

/** Diekspor (bukan cuma internal drawTextLayer/measureTextLayers lagi) —
    dipakai juga oleh Builder (FrameTextEditor) untuk menampilkan ISI teks
    sungguhan (bukan cuma kotak kosong) di atas kotak drag, dengan
    font/ukuran/tracking yang sudah dihitung sama seperti hasil ekspor. */
export function resolveTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  tokens: Record<string, string>,
  scale: number
): ResolvedTextLayer | null {
  let text = fill(layer.text, tokens);
  if (!text) return null;
  if (layer.uppercase) text = text.toUpperCase();

  const lines = text.split("\n");
  const tracking = (layer.tracking ?? 0) * scale;
  // fontFamily override (font sistem/pilihan bebas per-teks) menang atas
  // `face` (tema template) kalau diisi — lihat komentar TextLayer.fontFamily
  // di types.ts.
  const family = layer.fontFamily || familyFor(layer.face);
  const weight = layer.weight ?? 400;
  const lineHeight = layer.lineHeight ?? 1.2;
  const italic = layer.italic ?? false;

  // Kecilkan otomatis bila terlalu panjang. Nama pengantin bisa sangat panjang
  // ("Nur Aisyah Rahmadhani & Muhammad Fadhlurrahman") dan tidak boleh keluar
  // dari kertas — ini kasus yang pasti terjadi, bukan tepi jarang. Baris
  // terpanjang yang menentukan, supaya semua baris menyusut serentak
  // (kalau tidak, tiap baris punya ukuran font berbeda — terlihat rusak).
  let size = layer.size * scale;
  ctx.font = fontString(weight, size, family, italic);
  if (layer.maxWidth) {
    const limit = layer.maxWidth * scale;
    const widest = () => Math.max(...lines.map((l) => measure(ctx, l, tracking)));
    let guard = 0;
    while (widest() > limit && size > 8 && guard++ < 40) {
      size *= 0.94;
      ctx.font = fontString(weight, size, family, italic);
    }
  }

  return { lines, size, family, weight, tracking, lineHeight, italic };
}

/** Diekspor — dipakai juga lib/video.ts (kartu video pesan suara) untuk
    menggambar videoTextLayers langsung per-frame di loop animasinya
    sendiri, BUKAN lewat drawTextLayers() (plural, di bawah) yang async
    dan await document.fonts.ready tiap panggilan — terlalu mahal dipanggil
    30×/detik. Sama satu fungsi dengan yang dipakai compose()/drawTextLayers,
    jadi hasilnya selalu sinkron. */
export function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  tokens: Record<string, string>,
  scale: number
) {
  if (layer.hidden) return;
  const resolved = resolveTextLayer(ctx, layer, tokens, scale);
  if (!resolved) return;

  const { lines, size, family, weight, tracking, lineHeight, italic } = resolved;
  ctx.font = fontString(weight, size, family, italic);
  ctx.fillStyle = layer.color;
  ctx.textBaseline = "alphabetic";

  const step = size * lineHeight;
  const x = layer.x * scale;
  const y0 = layer.y * scale;
  lines.forEach((line, i) => {
    drawTracked(ctx, line, x, y0 + step * i, layer.align, tracking);
  });
}

/**
 * Kotak batas tiap layer teks TAMPAK (bukan tersembunyi), dalam piksel
 * kanvas pada `scale` yang diberikan — dipakai editor untuk menempatkan
 * handle DOM tepat di atas teks yang sungguhan tergambar. Memakai
 * `resolveTextLayer` yang SAMA dengan `drawTextLayer`, jadi ukurannya
 * selalu sinkron dengan hasil ekspor.
 *
 * x/y layer adalah baseline baris PERTAMA (sesuai kontrak drawTracked),
 * jadi kotaknya diperluas ~0.25× ukuran font ke atas untuk mendekati
 * cap-height — cukup akurat untuk keperluan klik & drag, bukan pengukuran
 * tipografis presisi piksel.
 */
export interface TextLayerBounds {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function measureTextLayers(
  ctx: CanvasRenderingContext2D,
  layers: TextLayer[],
  tokens: Record<string, string>,
  scale: number
): TextLayerBounds[] {
  const out: TextLayerBounds[] = [];
  layers.forEach((layer, index) => {
    if (layer.hidden) return;
    const resolved = resolveTextLayer(ctx, layer, tokens, scale);
    if (!resolved) return;
    ctx.font = fontString(resolved.weight, resolved.size, resolved.family, resolved.italic);
    const widest = Math.max(
      ...resolved.lines.map((l) => measure(ctx, l, resolved.tracking))
    );
    const step = resolved.size * resolved.lineHeight;
    const totalH = resolved.size * 1.25 + step * (resolved.lines.length - 1);
    const baseX = layer.x * scale;
    const x =
      layer.align === "center" ? baseX - widest / 2 : layer.align === "right" ? baseX - widest : baseX;
    out.push({ index, x, y: layer.y * scale - resolved.size * 0.9, w: widest, h: totalH });
  });
  return out;
}

export interface ComposeOptions {
  template: Template;
  frames: (ImageBitmap | null)[];
  filterCss: string;
  mirror: boolean;
  tokens?: Record<string, string>;
  /** 1 = resolusi ekspor penuh. Pakai 0.3–0.5 untuk preview. */
  scale?: number;
}

/**
 * Lapisan 1 (dasar): kertas + foto + overlay PNG — TANPA teks. Dipecah dari
 * `compose()` supaya Frame Builder admin bisa menggambar ulang dasarnya
 * SEKALI (mahal: memuat overlay, banyak drawImage) lalu menggambar ulang
 * teks saja berkali-kali saat klien menggeser layer (murah: cuma
 * `fillText`). Lihat docs/blueprint/07-canvas-designer.md §3.
 *
 * `compose()` di bawah tetap memanggil ini persis seperti sebelum
 * dipecah — playground & ekspor tamu TIDAK berubah sama sekali.
 */
export async function composeBase({
  template,
  frames,
  filterCss,
  mirror,
  scale = 1,
}: Omit<ComposeOptions, "tokens">): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(template.width * scale);
  canvas.height = Math.round(template.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak tersedia di perangkat ini.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = template.paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  template.slots.forEach((slot, i) => {
    const frame = frames[i];
    if (!frame) return;

    const { sx, sy, sw, sh } = coverRect(frame.width, frame.height, slot);
    const dx = slot.x * scale;
    const dy = slot.y * scale;
    const dw = slot.w * scale;
    const dh = slot.h * scale;

    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();

    // ctx.filter absen di sebagian WebView lama. Foto tetap tampil tanpa
    // filter — gagal pelan, bukan gagal total.
    if (filterCss !== "none" && "filter" in ctx) ctx.filter = filterCss;

    if (mirror) {
      ctx.translate(dx + dw, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(frame, sx, sy, sw, sh, 0, 0, dw, dh);
    } else {
      ctx.drawImage(frame, sx, sy, sw, sh, dx, dy, dw, dh);
    }
    ctx.restore();
  });

  // Overlay PNG vs ornamen kode — saling eksklusif (lihat komentar
  // Template.ornament di types.ts). Ornamen dibungkus try/catch juga:
  // satu bug di fungsi gambar custom TIDAK BOLEH menjatuhkan foto tamu
  // yang sudah tersusun (aturan sama dengan overlay gagal muat).
  if (template.overlay) {
    try {
      const overlay = await loadOverlay(template.overlay);
      ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
    } catch {
      // Overlay hilang bukan alasan kehilangan foto tamu.
    }
  } else if (template.ornament) {
    try {
      ctx.save();
      template.ornament(ctx, canvas.width, canvas.height);
      ctx.restore();
    } catch {
      // Sama seperti overlay PNG — ornamen gagal digambar bukan alasan
      // kehilangan foto tamu.
    }
  }

  return canvas;
}

/** Lapisan 2 (teks): digambar LANGSUNG ke canvas dasar yang sudah ada —
    dipanggil ulang tiap kali klien mengubah teks/posisi, tanpa menyentuh
    lapisan dasar sama sekali. */
export async function drawTextLayers(
  canvas: HTMLCanvasElement,
  layers: TextLayer[],
  tokens: Record<string, string>,
  scale: number
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  for (const layer of layers) {
    ctx.save();
    drawTextLayer(ctx, layer, tokens, scale);
    ctx.restore();
  }
}

export async function compose({
  template,
  frames,
  filterCss,
  mirror,
  tokens = {},
  scale = 1,
}: ComposeOptions): Promise<HTMLCanvasElement> {
  const canvas = await composeBase({ template, frames, filterCss, mirror, scale });
  await drawTextLayers(canvas, template.textLayers, tokens, scale);
  return canvas;
}

export async function captureFrame(video: HTMLVideoElement): Promise<ImageBitmap> {
  if (!video.videoWidth || !video.videoHeight) throw new Error("Kamera belum siap.");
  return createImageBitmap(video);
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Ekspor gagal."))),
      type,
      quality
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
