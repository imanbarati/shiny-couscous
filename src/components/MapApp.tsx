import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { type Feat, type Layer, type Pt, type Store, fromGeoJSON, seed, toGeoJSON, uid } from "../lib/model";

const KEY = "bridge-map:v1";
const dot = (color: string, sel: boolean) =>
  L.divIcon({ className: "", iconSize: [18, 18], iconAnchor: [9, 9],
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:${sel ? 3 : 2}px solid ${sel ? "#000" : "#fff"};box-shadow:0 0 3px #0008"></div>` });

type Mode = "view" | "point" | "line";

function Clicks({ mode, onPt }: { mode: Mode; onPt: (p: Pt) => void }) {
  useMapEvents({ click: (e) => mode !== "view" && onPt([+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5)]) });
  return null;
}

export default function MapApp() {
  const [store, setStore] = useState<Store>(() => {
    try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch {}
    return seed();
  });
  const [lang, setLang] = useState<"en" | "fa">("en");
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<Pt[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [active, setActive] = useState(store.layers[0]?.id ?? "");
  const [msg, setMsg] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const { layers, feats } = store;
  const t = (en: string, fa: string) => (lang === "fa" ? fa : en);
  const nm = (x: { name_en: string; name_fa: string }) => (lang === "fa" && x.name_fa ? x.name_fa : x.name_en);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} }, [store]);

  const layerById = useMemo(() => Object.fromEntries(layers.map((l) => [l.id, l])), [layers]);
  const selected = feats.find((f) => f.id === sel);
  const setLayers = (fn: (l: Layer[]) => Layer[]) => setStore((s) => ({ ...s, layers: fn(s.layers) }));
  const setFeats = (fn: (f: Feat[]) => Feat[]) => setStore((s) => ({ ...s, feats: fn(s.feats) }));
  const patch = (id: string, p: Partial<Feat>) => setFeats((fs) => fs.map((f) => (f.id === id ? { ...f, ...p } : f)));

  function onMapPt(p: Pt) {
    if (!active) return setMsg(t("Add a layer first", "ابتدا یک لایه بسازید"));
    if (mode === "point") {
      const f: Feat = { id: uid(), layerId: active, name_en: "New point", name_fa: "", note_en: "", note_fa: "", pts: [p] };
      setFeats((fs) => [...fs, f]); setSel(f.id); setMode("view");
    } else setDraft((d) => [...d, p]);
  }
  function finishLine() {
    if (draft.length >= 2) {
      const f: Feat = { id: uid(), layerId: active, name_en: "New line", name_fa: "", note_en: "", note_fa: "", pts: draft };
      setFeats((fs) => [...fs, f]); setSel(f.id);
    }
    setDraft([]); setMode("view");
  }
  function exportJson() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(toGeoJSON(store), null, 2)], { type: "application/geo+json" }));
    a.download = "map-layers.geojson"; a.click(); URL.revokeObjectURL(a.href);
  }
  async function importJson(f?: File) {
    if (!f) return;
    try {
      const s = fromGeoJSON(JSON.parse(await f.text()));
      setStore(s); setActive(s.layers[0].id); setSel(null); setMsg(t(`Imported ${s.feats.length} features`, `${s.feats.length} عارضه وارد شد`));
    } catch (e: any) { setMsg(String(e.message ?? e)); }
  }

  const css = `.app{display:flex;height:100dvh;font:14px system-ui,sans-serif}.side{width:340px;overflow:auto;padding:10px;border-inline-end:1px solid #ddd;background:#fafafa}
  .map{flex:1}.row{display:flex;gap:6px;align-items:center;margin:4px 0;flex-wrap:wrap}button,select,input,textarea{font:inherit}button{padding:4px 8px;cursor:pointer}
  textarea,input[type=text],input[type=date]{width:100%;box-sizing:border-box}h4{margin:12px 0 4px}.on{background:#222;color:#fff}
  @media(max-width:700px){.app{flex-direction:column-reverse}.side{width:auto;height:45dvh;border:0}.map{height:55dvh;flex:none}}`;

  return (
    <div className="app">
      <style>{css}</style>
      <div className="side" dir={lang === "fa" ? "rtl" : "ltr"}>
        <div className="row">
          <b style={{ flex: 1 }}>{t("Bridge strikes & trade routes", "حملات به پل‌ها و مسیرهای تجاری")}</b>
          <button onClick={() => setLang(lang === "en" ? "fa" : "en")}>{lang === "en" ? "فارسی" : "EN"}</button>
        </div>
        <div style={{ color: "#666", fontSize: 12 }}>{t("Edits are saved in this browser. Export GeoJSON to keep or share.", "ویرایش‌ها در همین مرورگر ذخیره می‌شود. برای نگه‌داری، GeoJSON خروجی بگیرید.")}</div>

        <h4>{t("Layers", "لایه‌ها")} ({layers.filter((l) => l.visible).length}/{layers.length})</h4>
        {layers.map((l) => (
          <div className="row" key={l.id}>
            <input type="checkbox" checked={l.visible} onChange={(e) => setLayers((ls) => ls.map((x) => (x.id === l.id ? { ...x, visible: e.target.checked } : x)))} />
            <input type="color" value={l.color} onChange={(e) => setLayers((ls) => ls.map((x) => (x.id === l.id ? { ...x, color: e.target.value } : x)))} />
            <input type="radio" name="active" checked={active === l.id} onChange={() => setActive(l.id)} title={t("Add new items here", "افزودن به این لایه")} />
            <span style={{ flex: 1 }}>{nm(l)} <small>({feats.filter((f) => f.layerId === l.id).length})</small></span>
            <button title="rename" onClick={() => { const n = prompt(t("Layer name (EN)", "نام لایه (EN)"), l.name_en); if (n) setLayers((ls) => ls.map((x) => (x.id === l.id ? { ...x, name_en: n } : x))); }}>✎</button>
            <button title="delete" onClick={() => { if (confirm(t("Delete layer and its items?", "لایه و عارضه‌هایش حذف شود؟"))) { setLayers((ls) => ls.filter((x) => x.id !== l.id)); setFeats((fs) => fs.filter((f) => f.layerId !== l.id)); if (active === l.id) setActive(""); } }}>🗑</button>
          </div>
        ))}
        <button onClick={() => { const n = prompt(t("New layer name", "نام لایه جدید")); if (n) { const l = { id: uid(), name_en: n, name_fa: "", color: "#7b1fa2", visible: true }; setLayers((ls) => [...ls, l]); setActive(l.id); } }}>+ {t("Layer", "لایه")}</button>

        <h4>{t("Edit", "ویرایش")}</h4>
        <div className="row">
          <button className={mode === "point" ? "on" : ""} onClick={() => { setDraft([]); setMode(mode === "point" ? "view" : "point"); }}>{t("Add point", "نقطه")}</button>
          <button className={mode === "line" ? "on" : ""} onClick={() => { setDraft([]); setMode(mode === "line" ? "view" : "line"); }}>{t("Add line", "خط")}</button>
          {mode === "line" && <button onClick={finishLine}>{t("Finish", "پایان")} ({draft.length})</button>}
        </div>
        {mode !== "view" && <small>{t("Click the map. Items go to the layer with the filled radio.", "روی نقشه کلیک کنید.")}</small>}

        {selected && (
          <div style={{ border: "1px solid #ccc", padding: 8, marginTop: 8, background: "#fff" }}>
            <select value={selected.layerId} onChange={(e) => patch(selected.id, { layerId: e.target.value })}>{layers.map((l) => <option key={l.id} value={l.id}>{nm(l)}</option>)}</select>
            <input type="text" placeholder="Name (EN)" value={selected.name_en} onChange={(e) => patch(selected.id, { name_en: e.target.value })} />
            <input type="text" dir="rtl" placeholder="نام (فارسی)" value={selected.name_fa} onChange={(e) => patch(selected.id, { name_fa: e.target.value })} />
            <input type="date" value={selected.date ?? ""} onChange={(e) => patch(selected.id, { date: e.target.value || undefined })} />
            <textarea rows={3} placeholder="Note (EN)" value={selected.note_en} onChange={(e) => patch(selected.id, { note_en: e.target.value })} />
            <textarea rows={3} dir="rtl" placeholder="یادداشت (فارسی)" value={selected.note_fa} onChange={(e) => patch(selected.id, { note_fa: e.target.value })} />
            {selected.pts.length === 1 && <small>{selected.pts[0].join(", ")} — {t("drag the marker to move", "برای جابه‌جایی، نشانگر را بکشید")}</small>}
            <div className="row"><button onClick={() => { setFeats((fs) => fs.filter((f) => f.id !== selected.id)); setSel(null); }}>{t("Delete", "حذف")}</button><button onClick={() => setSel(null)}>{t("Close", "بستن")}</button></div>
          </div>
        )}

        <h4>{t("Data", "داده")}</h4>
        <div className="row">
          <button onClick={exportJson}>{t("Export GeoJSON", "خروجی GeoJSON")}</button>
          <button onClick={() => file.current?.click()}>{t("Import", "ورود")}</button>
          <button onClick={() => { if (confirm(t("Reset to seed data?", "بازنشانی به داده اولیه؟"))) { const s = seed(); setStore(s); setActive(s.layers[0].id); setSel(null); } }}>{t("Reset", "بازنشانی")}</button>
          <input ref={file} type="file" accept=".geojson,.json" hidden onChange={(e) => { importJson(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
        {msg && <div style={{ color: "#a33" }}>{msg}</div>}
        <p style={{ color: "#777", fontSize: 12 }}>{t("Coordinates are approximate (town/region level). Verify against primary reporting.", "مختصات تقریبی است؛ با گزارش‌های اصلی تطبیق دهید.")}</p>
      </div>

      <MapContainer className="map" center={[32.5, 53.5]} zoom={5} style={{ flex: 1 }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Clicks mode={mode} onPt={onMapPt} />
        {feats.map((f) => {
          const l = layerById[f.layerId];
          if (!l?.visible) return null;
          const isSel = f.id === sel;
          const popup = <Popup><b>{nm(f)}</b>{f.date && <div>{f.date}</div>}<div>{(lang === "fa" && f.note_fa) || f.note_en}</div></Popup>;
          return f.pts.length === 1 ? (
            <Marker key={f.id} position={f.pts[0]} icon={dot(l.color, isSel)} draggable={mode === "view"}
              eventHandlers={{ click: () => mode === "view" && setSel(f.id), dragend: (e) => { const p = e.target.getLatLng(); patch(f.id, { pts: [[+p.lat.toFixed(5), +p.lng.toFixed(5)]] }); } }}>{popup}</Marker>
          ) : (
            <Polyline key={f.id} positions={f.pts} pathOptions={{ color: l.color, weight: isSel ? 6 : 3, dashArray: "6 6" }}
              eventHandlers={{ click: () => mode === "view" && setSel(f.id) }}>{popup}</Polyline>
          );
        })}
        {draft.length > 0 && <Polyline positions={draft} pathOptions={{ color: "#000", dashArray: "2 6" }} />}
      </MapContainer>
    </div>
  );
}
