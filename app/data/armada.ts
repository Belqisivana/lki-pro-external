export type GalleryItem = {
  id: string;
  img: string;
  title: string;
  specs: string[];
  category?: string;
  brand?: string;
  code?: string;
  available?: number;
};

export const armadaMeta: Record<string, { name: string; desc: string; matchCategories: string[] }> = {
  "sound-system": {
    name: "Sound System",
    desc: "Galeri detail perangkat Sound System profesional kami.",
    matchCategories: ["sound system", "sound", "audio"],
  },
  "lighting": {
    name: "Lighting",
    desc: "Galeri detail perangkat pencahayaan panggung canggih kami.",
    matchCategories: ["lighting", "lampu", "fx"],
  },
  "video-tron": {
    name: "LED Video Tron",
    desc: "Galeri detail layar LED resolusi tinggi kami.",
    matchCategories: ["led video tron", "videotron", "video tron", "multimedia", "led"],
  },
  "rigging-stage": {
    name: "Rigging / Stage",
    desc: "Konstruksi panggung kokoh bersertifikasi standar keamanan tinggi. Meliputi stage rigging, dan barikade untuk acara indoor maupun outdoor.",
    matchCategories: ["rigging / stage", "rigging", "stage", "panggung"],
  },
};

// Kompatibilitas untuk halaman statis seperti app/layanan/video-tron/page.tsx & rigging-stage/page.tsx
export const armadaDetails: Record<string, { name: string; desc: string; gallery: GalleryItem[] }> = {
  "sound-system": { name: armadaMeta["sound-system"].name, desc: armadaMeta["sound-system"].desc, gallery: [] },
  "lighting": { name: armadaMeta["lighting"].name, desc: armadaMeta["lighting"].desc, gallery: [] },
  "video-tron": { name: armadaMeta["video-tron"].name, desc: armadaMeta["video-tron"].desc, gallery: [] },
  "rigging-stage": { name: armadaMeta["rigging-stage"].name, desc: armadaMeta["rigging-stage"].desc, gallery: [] },
};

export async function fetchInternalGalleryBySlug(slug: string): Promise<GalleryItem[]> {
  const meta = armadaMeta[slug];
  if (!meta) return [];

  const baseUrl = process.env.NEXT_PUBLIC_INTERNAL_API_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/items?_t=${Date.now()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil data dari Internal (HTTP ${res.status})`);
  }

  const rawItems = await res.json();
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .filter((item: any) => {
      if (item.isUnknown || item.category === "Unknown") return false;
      const catLower = (item.category || "").toLowerCase().trim();
      return meta.matchCategories.some((m) => catLower === m || catLower.includes(m));
    })
    .map((item: any) => {
      const parsedSpecs = item.description
        ? String(item.description)
            .split(/\r?\n|;/)
            .map((s) => s.replace(/^[-•*]\s*/, "").trim())
            .filter(Boolean)
        : [];

      if (parsedSpecs.length === 0) {
        if (item.brand) parsedSpecs.push(`Brand: ${item.brand}`);
        if (item.subcategory) parsedSpecs.push(`Kategori Perangkat: ${item.subcategory}`);
        parsedSpecs.push(`Kode Inventaris: ${item.code || "-"}`);
      }

      return {
        id: String(item._id),
        img: item.masterPhoto || "/assets/loading/loading.png",
        title: item.name || "Tanpa Nama",
        specs: parsedSpecs,
        category: item.subcategory || item.category || "Umum",
        brand: item.brand || "",
        code: item.code || "",
        available: item.available ?? item.stock ?? 0,
      };
    });
}