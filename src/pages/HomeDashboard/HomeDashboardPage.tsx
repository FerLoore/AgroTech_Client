import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { getAgroFincas } from "../../api/AgroFinca.api";
import { getMapaFinca } from "../../api/agroFincaMapa.api";
import { getAgroUsuarios } from "../../api/AgroUsuario.api";
import { getHistorial } from "../../api/AgroHistorial.api";
import { getProductos } from "../../api/AgroProducto.api";

// ─── tipos mínimos para los datos del dashboard ───────────────────────────────
interface FincaOption {
  id: number;
  nombre: string;
  color: string;
  usu_usuario?: number;
}


// ─── datos de ejemplo (reemplazar con llamadas API reales) ────────────────────
const defaultFincas: FincaOption[] = [
  { id: 1, nombre: "Cargando fincas...", color: "#4a7c59" },
];

// Se usarán estados de base de datos en su lugar

// ─── helpers de badge ─────────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  "Crecimiento": { bg: "#EAF3DE", color: "#27500A" },
  "Producción": { bg: "#E6F1FB", color: "#0C447C" },
  "Enfermo": { bg: "#FAEEDA", color: "#633806" },
  "Muerto": { bg: "#FCEBEB", color: "#791F1F" },
};

function EstadoBadge({ estado }: { estado: string | null }) {
  if (!estado) return <span style={{ color: "#aaa", fontSize: 11 }}>—</span>;
  const s = BADGE_STYLES[estado] ?? { bg: "#f0ece4", color: "#5F5E5A" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 20,
      fontSize: 10, fontWeight: 500, background: s.bg, color: s.color,
    }}>
      {estado}
    </span>
  );
}

// ─── preview del mapa con react-leaflet (Real) ─────────────────────────────────
function MapaPreview({ mapaData, cargandoMapa }: { mapaData: any, cargandoMapa: boolean }) {
  if (cargandoMapa) {
    return (
      <div style={{ height: 220, background: "#e5e7eb", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#9ca3af" }}>
        Cargando terreno...
      </div>
    );
  }

  if (!mapaData || mapaData.error) {
    return (
      <div style={{ height: 220, background: "#e5e7eb", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#9ca3af" }}>
        {mapaData?.error ? "Sin datos del mapa para esta finca" : "Sin datos de terreno"}
      </div>
    );
  }

  const { finca, arboles, perimetro } = mapaData;

  // Agrupar perímetro
  const poligonosPorSeccion = (perimetro || []).reduce((acc: any, p: any) => {
    const sid = p.seccion_id || 0;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(p);
    return acc;
  }, {});

  // Identificar la última sección agregada (la que tenga el ID mayor)
  const ultimaSeccionId = Object.keys(poligonosPorSeccion)
    .map(Number)
    .filter(id => !isNaN(id) && id > 0)
    .sort((a, b) => b - a)[0];

  let centro: [number, number] = finca?.fin_latitud_origen && finca?.fin_longitud_origen
    ? [finca.fin_latitud_origen, finca.fin_longitud_origen]
    : [14.6349, -90.5069];

  // Si tenemos una última sección, calculamos su punto central para enfocar el mapa ahí
  if (ultimaSeccionId && poligonosPorSeccion[ultimaSeccionId]?.length > 0) {
    const pts = poligonosPorSeccion[ultimaSeccionId];
    const avgLat = pts.reduce((s: number, p: any) => s + p.lat, 0) / pts.length;
    const avgLng = pts.reduce((s: number, p: any) => s + p.lng, 0) / pts.length;
    centro = [avgLat, avgLng];
  }

  // Si el usuario quiere mostrar la última sección, podemos filtrar renderPoligonos para mostrar SOLO esa,
  // o mostrar todas. Según su petición de "quiero que muestre la ultima", filtraremos solo esta:
  const renderPoligonos = ultimaSeccionId && poligonosPorSeccion[ultimaSeccionId]?.length >= 3
    ? [{
      puntos: poligonosPorSeccion[ultimaSeccionId]
        .sort((a: any, b: any) => a.orden - b.orden)
        .map((p: any) => [p.lat, p.lng] as [number, number])
    }]
    : [];

  const COLORES_ESTADO: Record<string, string> = {
    Crecimiento: "#4a7c59", // verde mas suave
    Produccion: "#185FA5",
    Enfermo: "#A32D2D",
    Muerto: "#333333",
  };

  return (
    <div style={{ borderRadius: 10, background: "#c8e0b8", height: 220, position: "relative", overflow: "hidden" }}>
      <MapContainer center={centro} zoom={18} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} style={{ width: "100%", height: "100%", zIndex: 1 }}>
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />

        {renderPoligonos.map((poly, i) => (
          <Polygon key={i} positions={poly.puntos} pathOptions={{ color: "#a3e635", fillColor: "#84cc16", fillOpacity: 0.2, weight: 2 }} />
        ))}

        {(arboles || []).map((t: any, i: number) => {
          const color = COLORES_ESTADO[t.estado || "Crecimiento"] || "#4a7c59";
          return (
            <CircleMarker key={i} center={[t.lat, t.lng]} radius={4.5} pathOptions={{ fillColor: color, color: "#fff", fillOpacity: 1, weight: 1.5 }} />
          );
        })}
      </MapContainer>

      {/* leyenda superpuesta */}
      <div style={{
        position: "absolute", bottom: 8, left: 8,
        background: "rgba(255,255,255,.9)", borderRadius: 8, padding: "6px 10px",
        fontSize: 10, color: "#2d4a2d", display: "flex", gap: 10, alignItems: "center",
        zIndex: 1000, boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}>
        {[
          { color: COLORES_ESTADO["Crecimiento"], label: "Crecimiento" },
          { color: COLORES_ESTADO["Produccion"], label: "Producción" },
          { color: COLORES_ESTADO["Enfermo"], label: "Enfermo" },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 3, fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────
export default function HomeDashboardPage() {
  const navigate = useNavigate();

  const [fincas, setFincas] = useState<FincaOption[]>(defaultFincas);
  const [fincaActiva, setFincaActiva] = useState<FincaOption>(defaultFincas[0]);
  const [ddVisible, setDdVisible] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "enfermo" | "produccion">("todos");
  const [saludo, setSaludo] = useState("Buen día");
  const [fechaStr, setFechaStr] = useState("");
  const [usuariosBd, setUsuariosBd] = useState<any[]>([]);

  const [historialDb, setHistorialDb] = useState<any[]>([]);
  const alertasDb: any[] = [];
  const [productosDb, setProductosDb] = useState<any[]>([]);
  const [vistaInventario, setVistaInventario] = useState<"arboles" | "productos">("arboles");

  const [mapaDataFinca, setMapaDataFinca] = useState<any>(null);
  const [cargandoMapa, setCargandoMapa] = useState(false);

  useEffect(() => {
    if (fincaActiva?.id && fincaActiva.id !== 0) {
      setCargandoMapa(true);
      getMapaFinca(fincaActiva.id)
        .then((data) => setMapaDataFinca(data))
        .catch(() => setMapaDataFinca({ error: true }))
        .finally(() => setCargandoMapa(false));
    } else {
      setMapaDataFinca(null);
    }
  }, [fincaActiva]);

  useEffect(() => {
    const cargarFincas = async () => {
      try {
        const res = await getAgroFincas();
        if (res.data && res.data.fincas && res.data.fincas.length > 0) {
          const colores = ["#4a7c59", "#185FA5", "#854F0B", "#A32D2D"];
          const fincasDb = res.data.fincas.map((f: any, idx: number) => ({
            id: f.fin_finca,
            nombre: f.fin_nombre,
            color: colores[idx % colores.length],
            usu_usuario: f.fin_usu_usuario || f.usu_usuario
          }));
          setFincas(fincasDb);
          setFincaActiva(fincasDb[0]);
        } else {
          setFincas([{ id: 0, nombre: "Sin fincas creadas", color: "#888", usu_usuario: 0 }]);
        }
      } catch (error) {
        console.error("Error al cargar fincas:", error);
      }
    };
    cargarFincas();

    const cargarUsuario = async () => {
      try {
        const res = await getAgroUsuarios();
        if (res.data && res.data.usuarios) {
          setUsuariosBd(res.data.usuarios);
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error);
      }
    };
    cargarUsuario();

    const cargarDashData = async () => {
      try {
        const hist = await getHistorial();
        setHistorialDb(Array.isArray(hist) ? hist : (hist?.historiales || []));
      } catch (e) { console.error("Error historial", e); }

      try {
        const prod = await getProductos();
        setProductosDb(Array.isArray(prod) ? prod : (prod?.productos || []));
      } catch (e) { console.error("Error productos", e); }
    };
    cargarDashData();

    const h = new Date().getHours();
    setSaludo(h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");
    setFechaStr(new Date().toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" }));
  }, []);

  const nombreUsuario = useMemo(() => {
    if (!fincaActiva?.usu_usuario || usuariosBd.length === 0) return "Cargando dueño...";
    const dueno = usuariosBd.find(u => u.usu_usuario === fincaActiva.usu_usuario);
    return dueno ? dueno.usu_nombre : "Usuario";
  }, [fincaActiva, usuariosBd]);

  const arbolesFinca = mapaDataFinca?.arboles || [];
  const arbolesFincaIds = new Set(arbolesFinca.map((a: any) => a.id));

  const histMapeado = historialDb
    .filter((h: any) => arbolesFincaIds.has(h.arb_arbol))
    .map((h: any) => {
      const rawDate = String(h.histo_fecha_cambio ?? "").split("T")[0];
      const [y, m, d] = (rawDate || "2000-01-01").split("-");
      return {
        ref: `Árbol ${h.arb_arbol}`,
        antes: h.histo_estado_anterior || null,
        despues: h.histo_estado_nuevo,
        tipo: h.histo_estado_nuevo?.toLowerCase().includes("producci") ? "produccion" :
          h.histo_estado_nuevo?.toLowerCase().includes("enferm") ? "enfermo" :
            h.histo_estado_nuevo?.toLowerCase().includes("crecimient") ? "crecimiento" : "otro",
        cuando: `${d}/${m}/${y}`,
        _dateMs: new Date(h.histo_fecha_cambio).getTime()
      };
    }).sort((a: any, b: any) => b._dateMs - a._dateMs);

  const histFiltrado = histMapeado.filter(
    (r: any) => filtro === "todos" || r.tipo === filtro
  );

  const alertasMapeadas = alertasDb
    .filter((a: any) => arbolesFincaIds.has(a.arb_arbol))
    .map((a: any) => {
      const rawDate = String(a.fecha_deteccion ?? "").split("T")[0];
      const [y, m, d] = (rawDate || "2000-01-01").split("-");
      return {
        arbol: a.arb_arbol,
        descripcion: a.descripcion_sintoma || "Sin descripción",
        seccion: "General",
        patogeno: "",
        cuando: `${d}/${m}/${y}`,
        severidad: "media" as string,
        _dateMs: new Date(a.fecha_deteccion).getTime()
      };
    }).sort((a: any, b: any) => b._dateMs - a._dateMs);

  const totArb = arbolesFinca.length;
  const prodArb = arbolesFinca.filter((a: any) => a.estado?.toLowerCase().includes("producci")).length;
  const creArb = arbolesFinca.filter((a: any) => a.estado?.toLowerCase().includes("crecimient")).length;
  const enfArb = arbolesFinca.filter((a: any) => a.estado?.toLowerCase().includes("enferm")).length;
  const muerArb = arbolesFinca.filter((a: any) => a.estado?.toLowerCase().includes("muert")).length;
  const totalAlert = alertasMapeadas.length;

  const kpisData = [
    { label: "Total árboles", value: totArb, color: "#2d4a2d", sub: "activos en finca", trend: "", up: null as null | boolean, mod: "arboles" },
    { label: "En producción", value: prodArb, color: "#185FA5", sub: totArb ? `${Math.round(prodArb / totArb * 100)}% del inventario` : "0%", trend: "", up: null as null | boolean, mod: "arboles" },
    { label: "En crecimiento", value: creArb, color: "#854F0B", sub: totArb ? `${Math.round(creArb / totArb * 100)}% del inventario` : "0%", trend: "", up: null as null | boolean, mod: "arboles" },
    { label: "Enfermos", value: enfArb, color: "#A32D2D", sub: "requieren atención", trend: "", up: null as null | boolean, mod: "alertas" },
    { label: "Alertas activas", value: totalAlert, color: "#E24B4A", sub: "pendientes análisis", trend: "", up: null as null | boolean, mod: "alertas" },
  ];

  const totProd = productosDb.length;
  // Agrupar insumos dinámicamente por tipo
  const tiposAgrupados = productosDb.reduce((acc: any, p: any) => {
    const tipo = p.produ_tipo ? String(p.produ_tipo).trim() : "Otros";
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const prodPropsDinamic = Object.entries(tiposAgrupados)
    .sort((a: any, b: any) => b[1] - a[1]) // Mostrar los tipos con más productos primero
    .slice(0, 4) // Top 4 tipos
    .map(([tipo, count]: any, i) => {
      const coloresProd = ["#185FA5", "#4a7c59", "#854F0B", "#E24B4A"];
      return {
        label: tipo,
        count: count,
        pct: totProd ? Math.round((count / totProd) * 100) : 0,
        color: coloresProd[i % coloresProd.length]
      };
    });

  const inventarioProps = vistaInventario === "arboles" ? [
    { label: "Producción", count: prodArb, pct: totArb ? Math.round((prodArb / totArb) * 100) : 0, color: "#185FA5" },
    { label: "Crecimiento", count: creArb, pct: totArb ? Math.round((creArb / totArb) * 100) : 0, color: "#4a7c59" },
    { label: "Enfermo", count: enfArb, pct: totArb ? Math.round((enfArb / totArb) * 100) : 0, color: "#E24B4A" },
    { label: "Muerto", count: muerArb, pct: totArb ? Math.round((muerArb / totArb) * 100) : 0, color: "#888" },
  ] : (prodPropsDinamic.length > 0 ? prodPropsDinamic : [{ label: "Sin inventario", count: 0, pct: 0, color: "#888" }]);

  // ─── estilos inline compartidos ─────────────────────────────────────────────
  const S = {
    db: { background: "#f2ede4", padding: 24, minHeight: "100vh", fontFamily: "sans-serif" } as React.CSSProperties,
    card: { background: "#fff", borderRadius: 14, border: "0.5px solid #e4ddd4", padding: 18 } as React.CSSProperties,
    cardHd: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } as React.CSSProperties,
    cardTitle: { fontSize: 13, fontWeight: 500, color: "#2d4a2d" } as React.CSSProperties,
    cardLink: { fontSize: 11, color: "#4a7c59", cursor: "pointer", padding: "4px 10px", borderRadius: 6, border: "0.5px solid #c8d8c0" } as React.CSSProperties,
  };

  return (
    <div style={S.db} onClick={() => setDdVisible(false)}>

      {/* ── TOPBAR ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#2d4a2d" }}>{saludo}, {nombreUsuario}</div>
            <div style={{ fontSize: 12, color: "#9aaa9a", marginTop: 2 }}>Panel general de finca</div>
          </div>

          {/* selector de finca */}
          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <div
              onClick={() => setDdVisible(!ddVisible)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "0.5px solid #cdd8c8", borderRadius: 20, padding: "7px 14px", cursor: "pointer", fontSize: 13, color: "#2d4a2d", fontWeight: 500 }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: fincaActiva.color, display: "inline-block" }} />
              {fincaActiva.nombre}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4a7c59" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
            </div>
            {ddVisible && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "0.5px solid #cdd8c8", borderRadius: 12, padding: 6, zIndex: 10, minWidth: 200 }}>
                {fincas.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => { setFincaActiva(f); setDdVisible(false); }}
                    style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#2d4a2d", display: "flex", alignItems: "center", gap: 8, background: f.id === fincaActiva.id ? "#e8f3de" : "transparent", fontWeight: f.id === fincaActiva.id ? 500 : 400 }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: f.color, display: "inline-block" }} />
                    {f.nombre}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#fdf0ee", border: "0.5px solid #f5c4b3", borderRadius: 16, padding: "5px 13px", fontSize: 12, color: "#712B13" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#993C1D" strokeWidth="2" strokeLinecap="round" style={{ verticalAlign: "middle", marginRight: 3 }}>
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {totalAlert} alertas activas
          </div>
          <div style={{ background: "#fff", border: "0.5px solid #ddd8d0", borderRadius: 16, padding: "5px 13px", fontSize: 12, color: "#6b8c6b" }}>
            {fechaStr}
          </div>
        </div>
      </div>

      {/* ── MÉTRICAS KPI ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 10, marginBottom: 18 }}>
        {kpisData.map((m) => (
          <div
            key={m.label}
            onClick={() => navigate(`/agro-${m.mod}`)}
            style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e4ddd4", padding: "14px 16px", cursor: "pointer", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", borderRadius: "2px 0 0 2px", background: m.color }} />
            <div style={{ fontSize: 10, color: "#9aaa9a", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 500, color: m.color, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: "#b0b8a8", marginTop: 4 }}>{m.sub}</div>
            {m.up !== null && (
              <div style={{ fontSize: 10, marginTop: 6, display: "flex", alignItems: "center", gap: 3, color: m.up ? "#27500A" : "#791F1F" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d={m.up ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                </svg>
                {m.trend}
              </div>
            )}
            {m.up === null && <div style={{ fontSize: 10, marginTop: 6, color: "#9aaa9a" }}>{m.trend}</div>}
          </div>
        ))}
      </div>

      {/* ── MAIN GRID: mapa + inventario ───────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 16 }}>

        {/* card VISTA DE FINCA */}
        <div style={S.card}>
          <div style={S.cardHd}>
            <span style={S.cardTitle}>Vista de finca</span>
          </div>

          {/* mapa real leaflet */}
          <MapaPreview mapaData={mapaDataFinca} cargandoMapa={cargandoMapa} />

          {/* ── BOTÓN "ABRIR MAPA COMPLETO" dentro del card, bajo el mapa ── */}
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => navigate("/agro-mapa")}
              style={{
                width: "100%",
                padding: "9px 0",
                background: "#2d4a2d",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: ".3px",
              }}
            >
              Abrir mapa completo →
            </button>
          </div>
        </div>

        {/* card ESTADO DEL INVENTARIO */}
        <div style={S.card}>
          <div style={S.cardHd}>
            <span style={S.cardTitle}>Estado del inventario</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={vistaInventario}
                onChange={e => setVistaInventario(e.target.value as any)}
                style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, border: "1px solid #d4c9b0", background: "#f5f0e8", color: "#2d4a2d", outline: "none", cursor: "pointer" }}
              >
                <option value="arboles">Árboles</option>
                <option value="productos">Insumos</option>
              </select>
              <span style={S.cardLink} onClick={() => navigate(vistaInventario === "arboles" ? "/agro-arboles" : "/agro-productos")}>ver →</span>
            </div>
          </div>

          {inventarioProps.map((b) => (
            <div key={b.label} style={{ marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7a9a7a", marginBottom: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: b.color, display: "inline-block" }} />
                  {b.label}
                </span>
                <span>{b.count} · {b.pct}%</span>
              </div>
              <div style={{ height: 7, background: "#f0ece4", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${b.pct}%`, height: "100%", borderRadius: 4, background: b.color, transition: "width .7s cubic-bezier(.4,0,.2,1)" }} />
              </div>
            </div>
          ))}

          {/* accesos rápidos */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "0.5px solid #f0ece4" }}>
            <div style={{ fontSize: 10, color: "#9aaa9a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>Accesos rápidos</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "+ Nuevo Tratamiento", mod: "tratamientos", neutral: false },
                { label: "Análisis Laboratorio", mod: "analisis-laboratorio", neutral: true },
                { label: "Clima Local", mod: "clima", neutral: true },
                { label: "Catálogo Patógenos", mod: "catalogo-patogeno", neutral: true },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(`/agro-${a.mod}`)}
                  style={{
                    padding: 9,
                    background: a.neutral ? "#f0ece4" : "#f0f7ec",
                    border: "none", borderRadius: 8,
                    fontSize: 11, fontWeight: 500,
                    color: a.neutral ? "#5F5E5A" : "#27500A",
                    cursor: "pointer", textAlign: "center",
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM GRID: historial + alertas ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* card ÚLTIMOS CAMBIOS DE ESTADO */}
        <div style={S.card}>
          <div style={S.cardHd}>
            <span style={S.cardTitle}>Últimos cambios de estado</span>
            <span style={S.cardLink} onClick={() => navigate("/agro-historial")}>ver historial →</span>
          </div>

          {/* filtros */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {(["todos", "enfermo", "produccion"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  background: filtro === f ? "#2d4a2d" : "#f0ece4",
                  color: filtro === f ? "#fff" : "#5F5E5A",
                  border: "none", borderRadius: 16,
                  padding: "5px 13px", fontSize: 11, cursor: "pointer",
                }}
              >
                {f === "todos" ? "Todos" : f === "enfermo" ? "Enfermos" : "Producción"}
              </button>
            ))}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Ref", "Antes", "", "Después", "Cuándo"].map((h) => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontSize: 10, fontWeight: 500, color: "#9aaa9a", textTransform: "uppercase", letterSpacing: ".5px", borderBottom: "0.5px solid #f0ece4" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {histFiltrado.slice(0, 5).map((r) => (
                <tr key={r.ref} onClick={() => navigate("/agro-historial")} style={{ cursor: "pointer" }}>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f8f4f0", color: "#9aaa9a", fontSize: 11 }}>{r.ref}</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f8f4f0" }}><EstadoBadge estado={r.antes} /></td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f8f4f0", color: "#ccc" }}>→</td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f8f4f0" }}><EstadoBadge estado={r.despues} /></td>
                  <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f8f4f0", color: "#aaa", fontSize: 10 }}>{r.cuando}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* card ALERTAS DE SALUD RECIENTES */}
        <div style={S.card}>
          <div style={S.cardHd}>
            <span style={S.cardTitle}>Alertas de salud recientes</span>
            <span style={S.cardLink} onClick={() => navigate("/agro-alerta-salud")}>ver todas →</span>
          </div>

          {alertasMapeadas.slice(0, 5).map((a) => {
            const dotColor = a.severidad === "alta" ? "#A32D2D" : a.severidad === "media" ? "#854F0B" : "#888";
            return (
              <div
                key={a.arbol + a.descripcion}
                onClick={() => navigate("/agro-alerta-salud")}
                style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: "0.5px solid #f8f4f0", cursor: "pointer" }}
              >
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: "#1a1a1a", lineHeight: 1.35 }}>{a.descripcion} — árbol {a.arbol}</div>
                  <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>
                    Sección {a.seccion}{a.patogeno ? ` · ${a.patogeno}` : ""} · {a.cuando}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
