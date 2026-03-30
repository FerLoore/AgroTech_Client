// ============================================================
// AgroMapaPage.tsx
// Mapa interactivo de la finca con React Leaflet
//
// Muestra sobre OpenStreetMap:
//   - Polígono del perímetro de la finca
//   - Árboles coloreados por estado
//   - Zonas de cuarentena (círculos) alrededor de enfermos
//   - Filtros por sección y estado
//   - Popup con datos completos del árbol
// ============================================================

import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Polygon,
    Popup,
    Circle,
    Tooltip,
    LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { getMapaFinca, getFincas } from "../../api/agroFincaMapa.api";
import type { Finca, ArbolMapa, PuntoPerimetro } from "./agroMapa.types";
import { COLORES_ESTADO, ZOOM_INICIAL } from "./agroMapa.types";

const { BaseLayer } = LayersControl;

// ─────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────
const AgroMapaPage = () => {

    // ── Estado ──────────────────────────────────────────────
    const [fincas, setFincas] = useState<Finca[]>([]);
    const [fincaId, setFincaId] = useState<number | null>(null);
    const [finca, setFinca] = useState<Finca | null>(null);
    const [arboles, setArboles] = useState<ArbolMapa[]>([]);
    const [perimetro, setPerimetro] = useState<PuntoPerimetro[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Filtros
    const [filtroEstado, setFiltroEstado] = useState("all");
    const [filtroSeccion, setFiltroSeccion] = useState("all");
    const [cuarentena, setCuarentena] = useState(false);

    // ── Cargar lista de fincas al montar ────────────────────
    useEffect(() => {
        getFincas()
            .then((data: Finca[]) => {
                setFincas(data);
                if (data.length > 0) setFincaId(data[0].fin_finca);
            })
            .catch(() => setError("Error al cargar fincas"));
    }, []);

    // ── Cargar datos del mapa cuando cambia la finca ────────
    useEffect(() => {
        if (!fincaId) return;
        setLoading(true);
        setError("");
        getMapaFinca(fincaId)
            .then(data => {
                setFinca(data.finca);
                setArboles(data.arboles);
                setPerimetro(data.perimetro);
            })
            .catch(() => setError("Error al cargar el mapa. Verifica la conexión."))
            .finally(() => setLoading(false));
    }, [fincaId]);

    // ── Datos derivados ─────────────────────────────────────

    // Secciones únicas para el selector de filtro
    const secciones = [...new Set(arboles.map(a => a.seccion_nombre))];

    // Árboles filtrados por estado y sección
    const arbolesFiltrados = arboles.filter(a =>
        (filtroEstado === "all" || a.estado === filtroEstado) &&
        (filtroSeccion === "all" || a.seccion_nombre === filtroSeccion)
    );

    // Solo los enfermos para zonas de cuarentena
    const arbolesEnfermos = arboles.filter(a => a.estado === "Enfermo");

    // Polígono del perímetro ordenado
    const poligono: [number, number][] = perimetro
        .sort((a, b) => a.orden - b.orden)
        .map(p => [p.lat, p.lng]);

    // Centro del mapa
    const centro: [number, number] = finca
        ? [finca.fin_latitud_origen, finca.fin_longitud_origen]
        : [14.6349, -90.5069]; // Guatemala por defecto

    // Stats
    const stats = {
        total: arbolesFiltrados.length,
        produccion: arbolesFiltrados.filter(a => a.estado === "Produccion").length,
        enfermos: arbolesFiltrados.filter(a => a.estado === "Enfermo").length,
        crecimiento: arbolesFiltrados.filter(a => a.estado === "Crecimiento").length,
    };

    // ── Render ──────────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24, gap: 16 }}>

            {/* Encabezado */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>
                        Mapa de Finca
                    </h1>
                    <p style={{ fontSize: 13, color: "#7a9a7a", margin: "2px 0 0" }}>
                        {finca ? `${finca.fin_nombre} — ${arboles.length} árboles registrados` : "Selecciona una finca"}
                    </p>
                </div>

                {/* Controles */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Selector de finca */}
                    <select
                        value={fincaId ?? ""}
                        onChange={e => setFincaId(Number(e.target.value))}
                        style={selectStyle}
                    >
                        {fincas.map(f => (
                            <option key={f.fin_finca} value={f.fin_finca}>{f.fin_nombre}</option>
                        ))}
                    </select>

                    {/* Selector de sección */}
                    <select
                        value={filtroSeccion}
                        onChange={e => setFiltroSeccion(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="all">Todas las secciones</option>
                        {secciones.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* Filtros de estado */}
                    {(["all", "Produccion", "Enfermo", "Crecimiento"] as const).map(estado => (
                        <button
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            style={{
                                ...btnStyle,
                                background: filtroEstado === estado ? "#4a7c59" : "transparent",
                                color: filtroEstado === estado ? "#fff" : "#2d4a2d",
                                borderColor: filtroEstado === estado ? "#4a7c59" : "#c8d8c0",
                            }}
                        >
                            {estado === "all" ? "Todos" : estado}
                        </button>
                    ))}

                    {/* Toggle cuarentena */}
                    <button
                        onClick={() => setCuarentena(!cuarentena)}
                        style={{
                            ...btnStyle,
                            background: cuarentena ? "#c0392b" : "transparent",
                            color: cuarentena ? "#fff" : "#c0392b",
                            borderColor: "#c0392b",
                        }}
                    >
                        Cuarentena
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                    { label: "Total", val: stats.total, color: "#2d4a2d" },
                    { label: "Producción", val: stats.produccion, color: "#4a7c59" },
                    { label: "Enfermos", val: stats.enfermos, color: "#c0392b" },
                    { label: "Crecimiento", val: stats.crecimiento, color: "#e67e22" },
                ].map(s => (
                    <div key={s.label} style={{
                        background: "#fff", borderRadius: 10, padding: "8px 18px",
                        border: "0.5px solid #e8e0d0", textAlign: "center", minWidth: 80,
                    }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: 11, color: "#7a9a7a" }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Mensajes */}
            {error && <p style={{ color: "#c0392b", margin: 0 }}>{error}</p>}
            {loading && <p style={{ color: "#7a9a7a", margin: 0 }}>Cargando mapa...</p>}

            {/* Mapa */}
            <div style={{ flex: 1, minHeight: 500, borderRadius: 16, overflow: "hidden", border: "0.5px solid #e8e0d0" }}>
                <MapContainer
                    key={`mapa-${fincaId}`}          // fuerza remount al cambiar finca
                    center={centro}
                    zoom={ZOOM_INICIAL}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom
                >
                    <LayersControl position="topright">
                        {/* Capa base — OpenStreetMap */}
                        <BaseLayer checked name="Mapa de calles">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                maxZoom={20}
                            />
                        </BaseLayer>

                        {/* Capa satelital — ESRI (sin API key) */}
                        <BaseLayer name="Satelital">
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="&copy; Esri"
                                maxZoom={20}
                            />
                        </BaseLayer>
                    </LayersControl>

                    {/* Perímetro de la finca */}
                    {poligono.length >= 3 && (
                        <Polygon
                            positions={poligono}
                            pathOptions={{
                                color: "#4a7c59",
                                fillColor: "#4a7c59",
                                fillOpacity: 0.08,
                                weight: 2,
                                dashArray: "6 4",
                            }}
                        >
                            <Tooltip sticky>{finca?.fin_nombre}</Tooltip>
                        </Polygon>
                    )}

                    {/* Árboles */}
                    {arbolesFiltrados.map(arbol => (
                        <CircleMarker
                            key={arbol.id}
                            center={[arbol.lat, arbol.lng]}
                            radius={6}
                            pathOptions={{
                                fillColor: COLORES_ESTADO[arbol.estado] ?? "#888",
                                color: "#fff",
                                fillOpacity: 1,
                                weight: 1.5,
                            }}
                        >
                            <Popup>
                                <div style={{ minWidth: 200, fontFamily: "sans-serif" }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#2d4a2d", marginBottom: 10 }}>
                                        Árbol {arbol.referencia}
                                    </div>
                                    <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                                        <tbody>
                                            {[
                                                ["Sección", arbol.seccion_nombre],
                                                ["Surco", `Surco ${arbol.numero_surco}`],
                                                ["Estado", arbol.estado],
                                                ["Variedad", arbol.variedad],
                                                ["Siembra", arbol.fecha_siembra?.slice(0, 10)],
                                                ["Lat / Lng", `${arbol.lat.toFixed(6)} / ${arbol.lng.toFixed(6)}`],
                                            ].map(([k, v]) => (
                                                <tr key={k}>
                                                    <td style={{ color: "#7a9a7a", padding: "3px 8px 3px 0" }}>{k}</td>
                                                    <td style={{ fontWeight: 500, color: "#2d4a2d" }}>{v}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button style={popupBtnStyle}>
                                        + Nueva alerta
                                    </button>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}

                    {/* Zonas de cuarentena — solo si el toggle está activo */}
                    {cuarentena && arbolesEnfermos.map(a => [
                        <Circle
                            key={`c5-${a.id}`}
                            center={[a.lat, a.lng]}
                            radius={5}
                            pathOptions={{ color: "#c0392b", fillColor: "#c0392b", fillOpacity: 0.10, weight: 1.5, dashArray: "4 3" }}
                        />,
                        <Circle
                            key={`c10-${a.id}`}
                            center={[a.lat, a.lng]}
                            radius={10}
                            pathOptions={{ color: "#e67e22", fillColor: "#e67e22", fillOpacity: 0.06, weight: 1, dashArray: "4 3" }}
                        />,
                    ])}
                </MapContainer>
            </div>

            {/* Leyenda */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#7a9a7a" }}>
                {Object.entries(COLORES_ESTADO).map(([estado, color]) => (
                    <span key={estado} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                        {estado}
                    </span>
                ))}
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 14, height: 0, borderTop: "2px dashed #4a7c59", display: "inline-block" }} />
                    Perímetro
                </span>
                {cuarentena && <>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 14, height: 0, borderTop: "2px dashed #c0392b", display: "inline-block" }} />
                        Cuarentena 5m
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 14, height: 0, borderTop: "2px dashed #e67e22", display: "inline-block" }} />
                        Alerta 10m
                    </span>
                </>}
            </div>
        </div>
    );
};

// ── Estilos inline ───────────────────────────────────────────
const selectStyle: React.CSSProperties = {
    fontSize: 12, padding: "5px 10px",
    border: "0.5px solid #c8d8c0", borderRadius: 20,
    background: "#fff", color: "#2d4a2d",
    cursor: "pointer", outline: "none",
};

const btnStyle: React.CSSProperties = {
    fontSize: 12, padding: "5px 12px",
    border: "0.5px solid", borderRadius: 20,
    cursor: "pointer", transition: "all 0.15s",
    background: "transparent",
};

const popupBtnStyle: React.CSSProperties = {
    marginTop: 10, width: "100%", padding: "6px",
    fontSize: 11, borderRadius: 6, border: "none",
    background: "#4a7c59", color: "#fff",
    cursor: "pointer", fontWeight: 600,
};

export default AgroMapaPage;