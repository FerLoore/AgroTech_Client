// ============================================================
// AgroMapaPage.tsx — con modo "Configurar Finca"
// ============================================================

import { useEffect, useState, useRef } from "react";
import {
    MapContainer, TileLayer, CircleMarker, Polygon,
    Popup, Circle, Tooltip, LayersControl, useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "leaflet";

import { getMapaFinca, getFincas, guardarPerimetro } from "../../api/agroFincaMapa.api";
import type { Finca, ArbolMapa, PuntoPerimetro } from "./agroMapa.types";
import { COLORES_ESTADO, ZOOM_INICIAL } from "./agroMapa.types";

const { BaseLayer } = LayersControl;

// ─────────────────────────────────────────────────────────────
// Sub-componente: captura clicks del mapa para dibujar perímetro
// ─────────────────────────────────────────────────────────────
const CapturarClicks = ({
    activo,
    onPunto,
}: {
    activo: boolean;
    onPunto: (latlng: LatLng) => void;
}) => {
    useMapEvents({
        click(e) {
            if (activo) onPunto(e.latlng);
        },
    });
    return null;
};

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
const AgroMapaPage = () => {

    // ── Estado del mapa ─────────────────────────────────────
    const [fincas, setFincas] = useState<Finca[]>([]);
    const [fincaId, setFincaId] = useState<number | null>(null);
    const [finca, setFinca] = useState<Finca | null>(null);
    const [arboles, setArboles] = useState<ArbolMapa[]>([]);
    const [perimetro, setPerimetro] = useState<PuntoPerimetro[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ── Filtros ─────────────────────────────────────────────
    const [filtroEstado, setFiltroEstado] = useState("all");
    const [filtroSeccion, setFiltroSeccion] = useState("all");
    const [cuarentena, setCuarentena] = useState(false);

    // ── Modo dibujo de perímetro ─────────────────────────────
    const [modoPerimetro, setModoPerimetro] = useState(false);
    const [puntosNuevos, setPuntosNuevos] = useState<{ lat: number; lng: number }[]>([]);
    const [guardandoPerim, setGuardandoPerim] = useState(false);
    const [msgPerimetro, setMsgPerimetro] = useState("");

    // ── Modo nueva sección/árbol (panel lateral) ─────────────
    const [panelSiembra, setPanelSiembra] = useState(false);
    const [formSiembra, setFormSiembra] = useState({
        seccionNombre: "",
        numSurcos: "1",
        arbolesPorSurco: "5",
        espaciamiento: "2.5",
    });
    const [siembraMensaje, setSiembraMensaje] = useState("");

    // ─────────────────────────────────────────────────────────
    // Carga inicial
    // ─────────────────────────────────────────────────────────
    useEffect(() => {
        getFincas()
            .then((data: Finca[]) => {
                setFincas(data);
                if (data.length > 0) setFincaId(data[0].fin_finca);
            })
            .catch(() => setError("Error al cargar fincas"));
    }, []);

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
            .catch(() => setError("Error al cargar el mapa"))
            .finally(() => setLoading(false));
    }, [fincaId]);

    // ─────────────────────────────────────────────────────────
    // Datos derivados
    // ─────────────────────────────────────────────────────────
    const secciones = [...new Set(arboles.map(a => a.seccion_nombre))];

    const arbolesFiltrados = arboles.filter(a =>
        (filtroEstado === "all" || a.estado === filtroEstado) &&
        (filtroSeccion === "all" || a.seccion_nombre === filtroSeccion)
    );

    const arbolesEnfermos = arboles.filter(a => a.estado === "Enfermo");

    // Perímetro guardado
    const poligonoGuardado: [number, number][] = perimetro
        .sort((a, b) => a.orden - b.orden)
        .map(p => [p.lat, p.lng]);

    // Perímetro en construcción (mientras dibuja)
    const poligonoNuevo: [number, number][] = puntosNuevos.map(p => [p.lat, p.lng]);

    const centro: [number, number] = finca
        ? [finca.fin_latitud_origen, finca.fin_longitud_origen]
        : [14.6349, -90.5069];

    const stats = {
        total: arbolesFiltrados.length,
        produccion: arbolesFiltrados.filter(a => a.estado === "Produccion").length,
        enfermos: arbolesFiltrados.filter(a => a.estado === "Enfermo").length,
        crecimiento: arbolesFiltrados.filter(a => a.estado === "Crecimiento").length,
    };

    // ─────────────────────────────────────────────────────────
    // Handlers perímetro
    // ─────────────────────────────────────────────────────────
    const agregarPunto = (latlng: LatLng) => {
        setPuntosNuevos(prev => [...prev, { lat: latlng.lat, lng: latlng.lng }]);
    };

    const deshacerPunto = () => {
        setPuntosNuevos(prev => prev.slice(0, -1));
    };

    const limpiarPuntos = () => {
        setPuntosNuevos([]);
        setMsgPerimetro("");
    };

    const guardarPerimetroNuevo = async () => {
        if (!fincaId) return;
        if (puntosNuevos.length < 3) {
            setMsgPerimetro("Necesitas al menos 3 puntos para definir el perímetro.");
            return;
        }
        setGuardandoPerim(true);
        setMsgPerimetro("");
        try {
            await guardarPerimetro(fincaId, puntosNuevos);
            setMsgPerimetro("✓ Perímetro guardado exitosamente.");
            setPuntosNuevos([]);
            setModoPerimetro(false);
            // Recargar mapa para mostrar perímetro nuevo
            const data = await getMapaFinca(fincaId);
            setFinca(data.finca);
            setArboles(data.arboles);
            setPerimetro(data.perimetro);
        } catch {
            setMsgPerimetro("Error al guardar el perímetro. Intenta de nuevo.");
        } finally {
            setGuardandoPerim(false);
        }
    };

    // ─────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24, gap: 14 }}>

            {/* ── Encabezado + controles ─────────────────── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>Mapa de Finca</h1>
                    <p style={{ fontSize: 13, color: "#7a9a7a", margin: "2px 0 0" }}>
                        {finca ? `${finca.fin_nombre} — ${arboles.length} árboles` : "Selecciona una finca"}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <select value={fincaId ?? ""} onChange={e => setFincaId(Number(e.target.value))} style={selectStyle}>
                        {fincas.map(f => <option key={f.fin_finca} value={f.fin_finca}>{f.fin_nombre}</option>)}
                    </select>
                    <select value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)} style={selectStyle}>
                        <option value="all">Todas las secciones</option>
                        {secciones.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {(["all", "Produccion", "Enfermo", "Crecimiento"] as const).map(e => (
                        <button key={e} onClick={() => setFiltroEstado(e)} style={{
                            ...btnStyle,
                            background: filtroEstado === e ? "#4a7c59" : "transparent",
                            color: filtroEstado === e ? "#fff" : "#2d4a2d",
                            borderColor: filtroEstado === e ? "#4a7c59" : "#c8d8c0",
                        }}>
                            {e === "all" ? "Todos" : e}
                        </button>
                    ))}
                    <button onClick={() => setCuarentena(!cuarentena)} style={{
                        ...btnStyle,
                        background: cuarentena ? "#c0392b" : "transparent",
                        color: cuarentena ? "#fff" : "#c0392b",
                        borderColor: "#c0392b",
                    }}>Cuarentena</button>

                    {/* Botón dibujar perímetro */}
                    <button
                        onClick={() => { setModoPerimetro(!modoPerimetro); setPuntosNuevos([]); setMsgPerimetro(""); }}
                        style={{
                            ...btnStyle,
                            background: modoPerimetro ? "#185FA5" : "transparent",
                            color: modoPerimetro ? "#fff" : "#185FA5",
                            borderColor: "#185FA5",
                        }}
                    >
                        {modoPerimetro ? "Cancelar dibujo" : "Dibujar perímetro"}
                    </button>

                    {/* Botón plantar árboles */}
                    <button
                        onClick={() => setPanelSiembra(!panelSiembra)}
                        style={{
                            ...btnStyle,
                            background: panelSiembra ? "#b45309" : "transparent",
                            color: panelSiembra ? "#fff" : "#b45309",
                            borderColor: "#b45309",
                        }}
                    >
                        {panelSiembra ? "Cerrar siembra" : "Plantar árboles"}
                    </button>
                </div>
            </div>

            {/* ── Banner modo dibujo ─────────────────────── */}
            {modoPerimetro && (
                <div style={{
                    background: "#ddeef8", border: "0.5px solid #185FA5",
                    borderRadius: 10, padding: "10px 16px",
                    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                }}>
                    <span style={{ fontSize: 13, color: "#185FA5", fontWeight: 500 }}>
                        Modo dibujo activo — Hacé click en el mapa para agregar puntos
                    </span>
                    <span style={{ fontSize: 12, color: "#185FA5" }}>
                        {puntosNuevos.length} punto{puntosNuevos.length !== 1 ? "s" : ""} marcado{puntosNuevos.length !== 1 ? "s" : ""}
                    </span>
                    <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                        <button onClick={deshacerPunto} disabled={puntosNuevos.length === 0} style={btnAccionStyle("#888")}>
                            ← Deshacer
                        </button>
                        <button onClick={limpiarPuntos} style={btnAccionStyle("#c0392b")}>
                            Limpiar todo
                        </button>
                        <button
                            onClick={guardarPerimetroNuevo}
                            disabled={puntosNuevos.length < 3 || guardandoPerim}
                            style={btnAccionStyle("#185FA5")}
                        >
                            {guardandoPerim ? "Guardando..." : `Guardar perímetro (${puntosNuevos.length} pts)`}
                        </button>
                    </div>
                    {msgPerimetro && (
                        <p style={{ margin: 0, fontSize: 12, color: msgPerimetro.startsWith("✓") ? "#2d6a2d" : "#c0392b", width: "100%" }}>
                            {msgPerimetro}
                        </p>
                    )}
                </div>
            )}

            {/* ── Panel siembra lateral ─────────────────── */}
            {panelSiembra && (
                <div style={{
                    background: "#fff8f0", border: "0.5px solid #e67e22",
                    borderRadius: 10, padding: "16px",
                }}>
                    <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#b45309" }}>
                        Plantar árboles nuevos — estado inicial: Crecimiento
                    </p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div>
                            <label style={labelStyle}>Nombre sección</label>
                            <input
                                value={formSiembra.seccionNombre}
                                onChange={e => setFormSiembra({ ...formSiembra, seccionNombre: e.target.value })}
                                placeholder="Ej: Sección Norte"
                                style={{ ...inputStyle, width: 180 }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Cantidad de surcos</label>
                            <input type="number" min="1" max="20"
                                value={formSiembra.numSurcos}
                                onChange={e => setFormSiembra({ ...formSiembra, numSurcos: e.target.value })}
                                style={{ ...inputStyle, width: 100 }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Árboles por surco</label>
                            <input type="number" min="1" max="50"
                                value={formSiembra.arbolesPorSurco}
                                onChange={e => setFormSiembra({ ...formSiembra, arbolesPorSurco: e.target.value })}
                                style={{ ...inputStyle, width: 120 }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Espaciamiento (m)</label>
                            <input type="number" min="1" step="0.5"
                                value={formSiembra.espaciamiento}
                                onChange={e => setFormSiembra({ ...formSiembra, espaciamiento: e.target.value })}
                                style={{ ...inputStyle, width: 110 }}
                            />
                        </div>
                        <div style={{
                            padding: "8px 14px", background: "#fef3c7",
                            borderRadius: 8, fontSize: 12, color: "#b45309",
                            border: "0.5px solid #e67e22"
                        }}>
                            Total: <strong>{Number(formSiembra.numSurcos) * Number(formSiembra.arbolesPorSurco)}</strong> árboles
                        </div>
                        <button
                            onClick={() => setSiembraMensaje("Para crear surcos y árboles usa la sección Surcos → Árboles del menú. El mapa se actualiza automáticamente.")}
                            style={{ ...btnAccionStyle("#b45309"), alignSelf: "flex-end" }}
                        >
                            Ver instrucciones
                        </button>
                    </div>
                    {siembraMensaje && (
                        <div style={{ marginTop: 10, padding: "8px 12px", background: "#fff", borderRadius: 8, fontSize: 12, color: "#2d4a2d", border: "0.5px solid #c8d8c0" }}>
                            {siembraMensaje}
                        </div>
                    )}
                </div>
            )}

            {/* ── Stats ─────────────────────────────────── */}
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

            {error && <p style={{ color: "#c0392b", margin: 0 }}>{error}</p>}
            {loading && <p style={{ color: "#7a9a7a", margin: 0 }}>Cargando mapa...</p>}

            {/* ── Mapa ───────────────────────────────────── */}
            <div style={{ flex: 1, minHeight: 460, borderRadius: 16, overflow: "hidden", border: "0.5px solid #e8e0d0" }}>
                <MapContainer
                    key={`mapa-${fincaId}`}
                    center={centro}
                    zoom={ZOOM_INICIAL}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom
                    // cursor en modo dibujo
                    className={modoPerimetro ? "cursor-crosshair" : ""}
                >
                    {/* Captura clicks para el perímetro */}
                    <CapturarClicks activo={modoPerimetro} onPunto={agregarPunto} />

                    <LayersControl position="topright">
                        <BaseLayer checked name="Mapa de calles">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                maxZoom={20}
                            />
                        </BaseLayer>
                        <BaseLayer name="Satelital">
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="&copy; Esri"
                                maxZoom={20}
                            />
                        </BaseLayer>
                    </LayersControl>

                    {/* Perímetro guardado en BDD */}
                    {poligonoGuardado.length >= 3 && (
                        <Polygon
                            positions={poligonoGuardado}
                            pathOptions={{ color: "#4a7c59", fillColor: "#4a7c59", fillOpacity: 0.08, weight: 2, dashArray: "6 4" }}
                        >
                            <Tooltip sticky>{finca?.fin_nombre}</Tooltip>
                        </Polygon>
                    )}

                    {/* Perímetro en construcción — azul mientras dibuja */}
                    {modoPerimetro && poligonoNuevo.length >= 2 && (
                        <Polygon
                            positions={poligonoNuevo}
                            pathOptions={{ color: "#185FA5", fillColor: "#185FA5", fillOpacity: 0.10, weight: 2, dashArray: "4 3" }}
                        />
                    )}

                    {/* Puntos del perímetro en construcción */}
                    {modoPerimetro && puntosNuevos.map((p, i) => (
                        <CircleMarker
                            key={`np-${i}`}
                            center={[p.lat, p.lng]}
                            radius={5}
                            pathOptions={{ fillColor: "#185FA5", color: "#fff", fillOpacity: 1, weight: 2 }}
                        >
                            <Tooltip permanent direction="top">{i + 1}</Tooltip>
                        </CircleMarker>
                    ))}

                    {/* Árboles filtrados */}
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
                                                ["Coordenada", `${arbol.lat.toFixed(5)}, ${arbol.lng.toFixed(5)}`],
                                            ].map(([k, v]) => (
                                                <tr key={k}>
                                                    <td style={{ color: "#7a9a7a", padding: "3px 8px 3px 0" }}>{k}</td>
                                                    <td style={{ fontWeight: 500, color: "#2d4a2d" }}>{v}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button style={popupBtnStyle}>+ Nueva alerta</button>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}

                    {/* Zonas de cuarentena */}
                    {cuarentena && arbolesEnfermos.flatMap(a => [
                        <Circle key={`c5-${a.id}`} center={[a.lat, a.lng]} radius={5}
                            pathOptions={{ color: "#c0392b", fillColor: "#c0392b", fillOpacity: 0.10, weight: 1.5, dashArray: "4 3" }} />,
                        <Circle key={`c10-${a.id}`} center={[a.lat, a.lng]} radius={10}
                            pathOptions={{ color: "#e67e22", fillColor: "#e67e22", fillOpacity: 0.06, weight: 1, dashArray: "4 3" }} />,
                    ])}
                </MapContainer>
            </div>

            {/* ── Leyenda ─────────────────────────────────── */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#7a9a7a" }}>
                {Object.entries(COLORES_ESTADO).map(([estado, color]) => (
                    <span key={estado} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                        {estado}
                    </span>
                ))}
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 14, height: 0, borderTop: "2px dashed #4a7c59", display: "inline-block" }} />
                    Perímetro guardado
                </span>
                {modoPerimetro && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 14, height: 0, borderTop: "2px dashed #185FA5", display: "inline-block" }} />
                        Perímetro en construcción
                    </span>
                )}
            </div>
        </div>
    );
};

// ── Estilos ───────────────────────────────────────────────────
const selectStyle: React.CSSProperties = {
    fontSize: 12, padding: "5px 10px",
    border: "0.5px solid #c8d8c0", borderRadius: 20,
    background: "#fff", color: "#2d4a2d", cursor: "pointer", outline: "none",
};

const btnStyle: React.CSSProperties = {
    fontSize: 12, padding: "5px 12px",
    border: "0.5px solid", borderRadius: 20,
    cursor: "pointer", transition: "all 0.15s",
};

const btnAccionStyle = (color: string): React.CSSProperties => ({
    fontSize: 12, padding: "6px 14px",
    border: `0.5px solid ${color}`, borderRadius: 8,
    background: color, color: "#fff",
    cursor: "pointer", fontWeight: 500,
    opacity: 1,
});

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600,
    color: "#7a9a7a", textTransform: "uppercase",
    letterSpacing: 1, marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
    padding: "7px 10px", fontSize: 13,
    border: "0.5px solid #c8d8c0", borderRadius: 8,
    background: "#fff", color: "#2d4a2d", outline: "none",
};

const popupBtnStyle: React.CSSProperties = {
    marginTop: 10, width: "100%", padding: "6px",
    fontSize: 11, borderRadius: 6, border: "none",
    background: "#4a7c59", color: "#fff",
    cursor: "pointer", fontWeight: 600,
};

export default AgroMapaPage;