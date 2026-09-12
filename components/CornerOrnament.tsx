/** Dekorasi sudut versi KODE (SVG) — pengganti `decorUrl` (PNG) untuk
    template yang tidak punya aset ilustrasi sama sekali (wedding.ts dkk,
    lihat EventTheme.decorSvg di lib/templates/types.ts). Dipakai
    EventBooth.tsx dengan cara SAMA PERSIS seperti decorUrl (dipantulkan
    4 arah lewat CSS `scale(-1)`, bukan digambar ulang 4× di sini) —
    komponen ini cuma menggambar SATU motif pojok kiri-atas menghadap ke
    dalam, sisanya urusan CSS di pemanggilnya.

    Warna SENGAJA `currentColor` (bukan prop warna) — pemanggil cukup
    set `style={{ color: "var(--color-flash)" }}` di pembungkusnya,
    otomatis ikut tema aktif tanpa perlu tahu palet template ini.

    Motifnya SEPADAN dengan ornament() bingkai foto template yang sama
    (lihat lib/templates/wedding.ts dkk) — floral≈petalCluster,
    ring≈ringMotif, sunburst≈tickArc lebar, laurel≈angularLaurel — supaya
    identitas visual bingkai & sesi tamu terasa satu keluarga, bukan dua
    gaya lepas. */
export default function CornerOrnament({
  variant,
  size = 96,
}: {
  variant: "floral" | "ring" | "sunburst" | "laurel";
  size?: number;
}) {
  const common = { width: size, height: size, viewBox: "0 0 100 100", fill: "none", "aria-hidden": true as const };

  if (variant === "floral") {
    // Rumpun kelopak sederhana — beberapa bentuk teardrop memancar dari
    // pojok, ukuran beda-beda supaya terasa rimbun bukan simetris kaku.
    const petals = [0, 45, 90, 135, 180].map((deg, i) => (
      <path
        key={deg}
        d="M0,0 Q14,-6 28,0 Q14,6 0,0"
        transform={`rotate(${deg}) scale(${1 - i * 0.08})`}
        fill="currentColor"
        opacity={0.85 - i * 0.1}
      />
    ));
    return (
      <svg {...common}>
        <g transform="translate(6,6) rotate(35)">{petals}</g>
        <circle cx="8" cy="8" r="2.4" fill="currentColor" />
      </svg>
    );
  }

  if (variant === "ring") {
    // Dua cincin tumpang-tindih kecil, senada ringMotif() di
    // engagement-modern.ts — sengaja PALING minimal dari keempat varian.
    return (
      <svg {...common}>
        <circle cx="18" cy="18" r="10" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="27" cy="24" r="10" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }

  if (variant === "sunburst") {
    // Ledakan sinar dari satu titik, senada tickArc() ledakan sinar
    // birthday-gold.ts — garis panjang & jarang, bukan rapat.
    const rays = Array.from({ length: 7 }, (_, i) => {
      const angle = ((i / 6) * 60 - 30) * (Math.PI / 180);
      const x2 = 10 + Math.cos(angle) * 34;
      const y2 = 10 + Math.sin(angle) * 34;
      return <line key={i} x1="10" y1="10" x2={x2} y2={y2} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />;
    });
    return (
      <svg {...common}>
        {rays}
        <circle cx="10" cy="10" r="3" fill="currentColor" />
      </svg>
    );
  }

  // "laurel" — siku bersudut + tanda pendek, senada angularLaurel() di
  // wisuda-modern.ts.
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const angle = (i / 4) * (Math.PI / 2);
    const r1 = 20;
    const r2 = 28;
    return (
      <line
        key={i}
        x1={Math.cos(angle) * r1}
        y1={Math.sin(angle) * r1}
        x2={Math.cos(angle) * r2}
        y2={Math.sin(angle) * r2}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    );
  });
  return (
    <svg {...common}>
      <path d="M4,30 L4,4 L30,4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
      <g>{ticks}</g>
    </svg>
  );
}
