import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAgroFincas } from "../../api/AgroFinca.api";
import { getAgroUsuarios } from "../../api/AgroUsuario.api";
import { getHistorial } from "../../api/AgroHistorial.api";
import { getAlertas } from "../../api/AgroAlertaSalud.api";
import { getArboles } from "../../api/AgroArbol.api";

// ─── tipos mínimos para los datos del dashboard ───────────────────────────────
interface FincaOption {
  id: number;
  nombre: string;
  color: string;
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

// ─── mini-mapa SVG estático ────────────────────────────────────────────────────
function MapaPreview() {
  const trees = [
    { cx: 80, cy: 55, color: "#2d4a2d", label: "S1" },
    { cx: 120, cy: 55, color: "#2d4a2d" },
    { cx: 160, cy: 55, color: "#2d4a2d" },
    { cx: 200, cy: 55, color: "#2d4a2d" },
    { cx: 80, cy: 85, color: "#2d4a2d" },
    { cx: 120, cy: 85, color: "#185FA5" },
    { cx: 160, cy: 85, color: "#185FA5" },
    { cx: 200, cy: 85, color: "#2d4a2d" },
    { cx: 240, cy: 55, color: "#185FA5" },
    { cx: 240, cy: 85, color: "#185FA5" },
    { cx: 330, cy: 55, color: "#2d4a2d" },
    { cx: 370, cy: 55, color: "#185FA5" },
    { cx: 410, cy: 55, color: "#185FA5" },
    { cx: 450, cy: 55, color: "#185FA5" },
    { cx: 490, cy: 55, color: "#854F0B" },
    { cx: 330, cy: 85, color: "#185FA5" },
    { cx: 370, cy: 85, color: "#E24B4A", alert: true },
    { cx: 410, cy: 85, color: "#E24B4A", alert: true },
    { cx: 450, cy: 85, color: "#185FA5" },
    { cx: 80, cy: 155, color: "#185FA5" },
    { cx: 120, cy: 155, color: "#185FA5" },
    { cx: 160, cy: 155, color: "#854F0B" },
    { cx: 200, cy: 155, color: "#185FA5" },
    { cx: 330, cy: 155, color: "#185FA5" },
    { cx: 370, cy: 155, color: "#E24B4A", alert: true },
  ];

  return (
    <div style={{ borderRadius: 10, background: "#c8e0b8", height: 220, position: "relative", overflow: "hidden" }}>
      <svg viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <rect width="600" height="220" fill="#c8e0b8" />
        <polygon points="30,30 280,20 290,110 25,115" fill="#c4ddb4" />
        <polygon points="300,20 570,25 575,115 295,110" fill="#b8d4a8" />
        <polygon points="25,125 290,118 285,200 20,200" fill="#b8d4a8" />
        <polygon points="298,118 575,122 578,200 294,200" fill="#c4ddb4" />
        <line x1="292" y1="10" x2="292" y2="210" stroke="#a8c898" strokeWidth="2" strokeDasharray="6,4" />
        <line x1="10" y1="116" x2="590" y2="116" stroke="#a8c898" strokeWidth="2" strokeDasharray="6,4" />
        <text x="60" y="70" fontSize="9" fill="#3B6D11" fontFamily="sans-serif" opacity=".7">Sección A</text>
        <text x="370" y="70" fontSize="9" fill="#3B6D11" fontFamily="sans-serif" opacity=".7">Sección B</text>
        <text x="60" y="165" fontSize="9" fill="#3B6D11" fontFamily="sans-serif" opacity=".7">Sección C</text>
        <text x="370" y="165" fontSize="9" fill="#3B6D11" fontFamily="sans-serif" opacity=".7">Sección D</text>
        {trees.map((t, i) => (
          <g key={i} style={{ cursor: "pointer" }}>
            <circle cx={t.cx} cy={t.cy} r="7" fill={t.color} />
            {t.label && <text x={t.cx} y={t.cy + 3} textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif">{t.label}</text>}
            {t.alert && <text x={t.cx} y={t.cy + 3} textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif">!</text>}
          </g>
        ))}
      </svg>

      {/* leyenda superpuesta */}
      <div style={{
        position: "absolute", bottom: 8, left: 8,
        background: "rgba(255,255,255,.85)", borderRadius: 8, padding: "6px 10px",
        fontSize: 10, color: "#2d4a2d", display: "flex", gap: 10, alignItems: "center",
      }}>
        {[
          { color: "#2d4a2d", label: "Crecimiento" },
          { color: "#185FA5", label: "Producción" },
          { color: "#E24B4A", label: "Enfermo" },
          { color: "#854F0B", label: "Sospechoso" },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
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
  const [nombreUsuario, setNombreUsuario] = useState("Cargando...");

  const [historialDb, setHistorialDb] = useState<any[]>([]);
  const [alertasDb, setAlertasDb] = useState<any[]>([]);
  const [arbolesDb, setArbolesDb] = useState<any[]>([]);

  useEffect(() => {
    const cargarFincas = async () => {
      try {
        const res = await getAgroFincas();
        if (res.data && res.data.fincas && res.data.fincas.length > 0) {
          const colores = ["#4a7c59", "#185FA5", "#854F0B", "#A32D2D"];
          const fincasDb = res.data.fincas.map((f: any, idx: number) => ({
            id: f.fin_finca,
            nombre: f.fin_nombre,
            color: colores[idx % colores.length]
          }));
          setFincas(fincasDb);
          setFincaActiva(fincasDb[0]);
        } else {
          setFincas([{ id: 0, nombre: "Sin fincas creadas", color: "#888" }]);
        }
      } catch (error) {
        console.error("Error al cargar fincas:", error);
      }
    };
    cargarFincas();

    const cargarUsuario = async () => {
      try {
        const res = await getAgroUsuarios();
        if (res.data && res.data.usuarios && res.data.usuarios.length > 0) {
          // Asume el primer usuario activo de la bdd, a menos que se obtenga de un token auth
          setNombreUsuario(res.data.usuarios[0].usu_nombre);
        } else {
          setNombreUsuario("Usuario");
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error);
        setNombreUsuario("Usuario");
      }
    };
    cargarUsuario();

    const cargarDashData = async () => {
      try {
        const hist = await getHistorial();
        setHistorialDb(hist || []);
      } catch (e) { console.error("Error historial", e); }

      try {
        // Algunas APIs devuelven res.data y otras res.data.alertas
        const resAlertas = await getAlertas();
        setAlertasDb(resAlertas.alertas || resAlertas || []);
      } catch (e) { console.error("Error alertas", e); }

      try {
        const arb = await getArboles();
        setArbolesDb(arb || []);
      } catch (e) { console.error("Error arboles", e); }
    };
    cargarDashData();

    const h = new Date().getHours();
    setSaludo(h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");
    setFechaStr(new Date().toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" }));
  }, []);

  const histMapeado = historialDb.map((h: any) => {
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
  }).sort((a, b) => b._dateMs - a._dateMs);

  const histFiltrado = histMapeado.filter(
    (r) => filtro === "todos" || r.tipo === filtro
  );

  const alertasMapeadas = alertasDb.map((a: any) => {
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
  }).sort((a, b) => b._dateMs - a._dateMs);

  const totArb = arbolesDb.length;
  const prodArb = arbolesDb.filter(a => a.arb_estado?.toLowerCase().includes("producci")).length;
  const creArb = arbolesDb.filter(a => a.arb_estado?.toLowerCase().includes("crecimient")).length;
  const enfArb = arbolesDb.filter(a => a.arb_estado?.toLowerCase().includes("enferm")).length;
  const muerArb = arbolesDb.filter(a => a.arb_estado?.toLowerCase().includes("muert")).length;
  const totalAlert = alertasDb.length;

  const kpisData = [
    { label: "Total árboles", value: totArb, color: "#2d4a2d", sub: "activos en finca", trend: "", up: null as null | boolean, mod: "arboles" },
    { label: "En producción", value: prodArb, color: "#185FA5", sub: totArb ? `${Math.round(prodArb / totArb * 100)}% del inventario` : "0%", trend: "", up: null as null | boolean, mod: "arboles" },
    { label: "En crecimiento", value: creArb, color: "#854F0B", sub: totArb ? `${Math.round(creArb / totArb * 100)}% del inventario` : "0%", trend: "", up: null as null | boolean, mod: "arboles" },
    { label: "Enfermos", value: enfArb, color: "#A32D2D", sub: "requieren atención", trend: "", up: null as null | boolean, mod: "alertas" },
    { label: "Alertas activas", value: totalAlert, color: "#E24B4A", sub: "pendientes análisis", trend: "", up: null as null | boolean, mod: "alertas" },
  ];

  const inventarioProps = [
    { label: "Producción", count: prodArb, pct: totArb ? Math.round((prodArb / totArb) * 100) : 0, color: "#185FA5" },
    { label: "Crecimiento", count: creArb, pct: totArb ? Math.round((creArb / totArb) * 100) : 0, color: "#4a7c59" },
    { label: "Enfermo", count: enfArb, pct: totArb ? Math.round((enfArb / totArb) * 100) : 0, color: "#E24B4A" },
    { label: "Muerto", count: muerArb, pct: totArb ? Math.round((muerArb / totArb) * 100) : 0, color: "#888" },
  ];

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

          {/* mapa SVG */}
          <MapaPreview />

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
            <span style={S.cardLink} onClick={() => navigate("/agro-arboles")}>ver →</span>
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
                { label: "+ Nuevo árbol", mod: "arboles", neutral: false },
                { label: "Trazabilidad", mod: "trazabilidad", neutral: true },
                { label: "Auditoría", mod: "auditoria", neutral: true },
                { label: "Ver historial", mod: "historial", neutral: true },
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
