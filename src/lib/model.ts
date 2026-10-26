import strikes from "../data/strikes.json";
import logistics from "../data/logistics.json";

export type Pt = [number, number]; // [lat, lng]
export interface Layer { id: string; name_en: string; name_fa: string; color: string; visible: boolean }
export interface Feat {
  id: string; layerId: string; name_en: string; name_fa: string;
  note_en: string; note_fa: string; date?: string; pts: Pt[]; // 1 pt = point, 2+ = line
}
export interface Store { layers: Layer[]; feats: Feat[] }

export const uid = () => Math.random().toString(36).slice(2, 10);

export function seed(): Store {
  const layers: Layer[] = [
    { id: "strikes", name_en: "Reported bridge strikes", name_fa: "حملات گزارش‌شده به پل‌ها", color: "#d32f2f", visible: true },
    { id: "ports", name_en: "Ports", name_fa: "بنادر", color: "#1976d2", visible: true },
    { id: "borders", name_en: "Border crossings", name_fa: "گمرکات و مرزها", color: "#2e7d32", visible: true },
    { id: "corridors", name_en: "Trade corridors (schematic)", name_fa: "کریدورهای تجاری (شماتیک)", color: "#f57c00", visible: true },
  ];
  const feats: Feat[] = [];
  for (const e of strikes.events as any[])
    feats.push({ id: e.id, layerId: "strikes", name_en: e.name_en, name_fa: e.name_fa, note_en: e.summary_en, note_fa: e.summary_fa, date: e.date, pts: [[e.lat, e.lng]] });
  for (const [key, arr] of [["ports", logistics.ports], ["borders", logistics.borders]] as const)
    (arr as any[]).forEach((p, i) =>
      feats.push({ id: `${key}${i}`, layerId: key, name_en: p.name_en, name_fa: p.name_fa, note_en: p.note_en, note_fa: p.note_fa, pts: [[p.lat, p.lng]] }));
  (logistics.corridors as any[]).forEach((c, i) =>
    feats.push({ id: `c${i}`, layerId: "corridors", name_en: c.name_en, name_fa: c.name_fa, note_en: "", note_fa: "", pts: c.pts }));
  return { layers, feats };
}

export function toGeoJSON(s: Store) {
  return {
    type: "FeatureCollection", layers: s.layers,
    features: s.feats.map((f) => {
      const { pts, ...props } = f;
      const c = pts.map(([la, ln]) => [ln, la]);
      return { type: "Feature", properties: props,
        geometry: pts.length === 1 ? { type: "Point", coordinates: c[0] } : { type: "LineString", coordinates: c } };
    }),
  };
}

export function fromGeoJSON(g: any): Store {
  if (g?.type !== "FeatureCollection" || !Array.isArray(g.features)) throw new Error("Not a GeoJSON FeatureCollection");
  const layers: Layer[] = Array.isArray(g.layers) && g.layers.length ? g.layers : [{ id: "imported", name_en: "Imported", name_fa: "واردشده", color: "#7b1fa2", visible: true }];
  const feats: Feat[] = [];
  for (const f of g.features) {
    const t = f?.geometry?.type, c = f?.geometry?.coordinates, p = f.properties ?? {};
    const pts: Pt[] | null = t === "Point" ? [[c[1], c[0]]] : t === "LineString" ? c.map((x: number[]) => [x[1], x[0]]) : null;
    if (!pts || pts.some(([a, b]) => !isFinite(a) || !isFinite(b))) continue;
    feats.push({ id: p.id ?? uid(), layerId: layers.some((l) => l.id === p.layerId) ? p.layerId : layers[0].id,
      name_en: p.name_en ?? p.name ?? "", name_fa: p.name_fa ?? "", note_en: p.note_en ?? "", note_fa: p.note_fa ?? "", date: p.date, pts });
  }
  return { layers, feats };
}
