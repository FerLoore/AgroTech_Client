import { useEffect, useState, useRef } from "react";
import {
    MapContainer, TileLayer, CircleMarker, Polygon,
    Popup, Circle, Tooltip, LayersControl, useMapEvents, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng, Map as LeafletMap } from "leaflet";
import { getMapaFinca, getFincas, guardarPerimetro } from "../../api/agroFincaMapa.api";
import type { Finca, ArbolMapa, PuntoPerimetro } from "./agroMapa.types";
import { COLORES_ESTADO, ZOOM_INICIAL } from "./agroMapa.types";

const { BaseLayer } = LayersControl;

// ─────────────────────────────────────────────────────────────
// Controla drag del mapa según modo dibujo
// ─────────────────────────────────────────────────────────────
const ControlMapa = ({
    modoPerimetro,
    onPunto,
}: {
    modoPerimetro: boolean;
    onPunto: (latlng: LatLng) => void;
}) => {
    const map = useMap();

    useEffect(() => {
        if (modoPerimetro) {
            // Desactiva drag para que el click no mueva el mapa
            map.dragging.disable();
            map.getContainer().style.cursor = "crosshair";
        } else {
            map.dragging.enable();
            map.getContainer().style.cursor = "";
        }
        return () => {
            map.dragging.enable();
            map.getContainer().style.cursor = "";
        };
    }, [modoPerimetro, map]);

    useMapEvents({
        click(e) {
            if (modoPerimetro) onPunto(e.latlng);
        },
    });

    return null;
};

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
const AgroMapaPage = () => {

    const [fincas, setFincas] = useState<Finca[]>([]);
    const [fincaId, setFincaId] = useState<number | null>(null);
    const [finca, setFinca] = useState<Finca | null>(null);
    const [arboles, setArboles] = useState<ArbolMapa[]>([]);
    const [perimetro, setPerimetro] = useState<PuntoPerimetro[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [filtroEstado, setFiltroEstado] = useState("all");
    const [filtroSeccion, setFiltroSeccion] = useState("all");
    const [cuarentena, setCuarentena] = useState(false);

    // Modo dibujo
    const [modoPerimetro, setModoPerimetro] = useState(false);
    const [puntosNuevos, setPuntosNuevos] = useState<{ lat: number; lng: number }[]>([]);
    const [guardandoPerim, setGuardandoPerim] = useState(false);
    const [msgPerimetro, setMsgPerimetro] = useState("");

    // Modal configurar coordenadas de finca sin origen
    const [modalCoords, setModalCoords] = useState(false);
    const [coordsForm, setCoordsForm] = useState({ lat: "", lng: "" });
    const [guardandoCoords, setGuardandoCoords] = useState(false);

    // ── Carga fincas ─────────────────────────────────────────
    useEffect(() => {
        getFincas()
            .then((data: Finca[]) => {
                setFincas(data);
                if (data.length > 0) setFincaId(data[0].fin_finca);
            })
            .catch(() => setError("Error al cargar fincas"));
    }, []);

    // ── Carga mapa ───────────────────────────────────────────
    const cargarMapa = async (id: number) => {
        setLoading(true);
        setError("");
        try {
            const data = await getMapaFinca(id);
            setFinca(data.finca);
            setArboles(data.arboles);
            setPerimetro(data.perimetro);

            // Si la finca no tiene coordenadas de origen, abrir modal
            if (!data.finca.fin_latitud_origen || !data.finca.fin_longitud_origen) {
                setModalCoords(true);
                setCoordsForm({ lat: "14.6349", lng: "-90.5069" }); // Guatemala por defecto
            }
        } catch (e: any) {
            // Si el backend retorna 400 (sin coordenadas), mostrar modal
            if (e?.response?.status === 400) {
                setFinca(fincas.find(f => f.fin_finca === id) ?? null);
                setArboles([]);
                setPerimetro([]);
                setModalCoords(true);
                setCoordsForm({ lat: "14.6349", lng: "-90.5069" });
            } else {
                setError("Error al cargar el mapa");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!fincaId) return;
        setModoPerimetro(false);
        setPuntosNuevos([]);
        cargarMapa(fincaId);
    }, [fincaId]);

    // ── Guardar coordenadas de origen ────────────────────────
    const guardarCoords = async () => {
        if (!fincaId || !coordsForm.lat || !coordsForm.lng) return;
        setGuardandoCoords(true);
        try {
            // Importar api directo para el PUT de finca
            const { default: api } = await import("../../api/Axios");
            await api.put(`/agro-finca/${fincaId}`, {
                fin_latitud_origen: Number(coordsForm.lat),
                fin_longitud_origen: Number(coordsForm.lng),
            });
            setModalCoords(false);
            await cargarMapa(fincaId);
        } catch {
            alert("Error al guardar las coordenadas");
        } finally {
            setGuardandoCoords(false);
        }
    };

    // ── Datos derivados ──────────────────────────────────────
    const secciones = [...new Set(arboles.map(a => a.seccion_nombre))];

    const arbolesFiltrados = arboles.filter(a =>
        (filtroEstado === "all" || a.estado === filtroEstado) &&
        (filtroSeccion === "all" || a.seccion_nombre === filtroSeccion)
    );

    const arbolesEnfermos = arboles.filter(a => a.estado === "Enfermo");

    const poligonoGuardado: [number, number][] = perimetro
        .sort((a, b) => a.orden - b.orden)
        .map(p => [p.lat, p.lng]);

    const poligonoNuevo: [number, number][] = puntosNuevos.map(p => [p.lat, p.lng]);

    const centro: [number, number] = finca?.fin_latitud_origen
        ? [finca.fin_latitud_origen, finca.fin_longitud_origen]
        : [14.6349, -90.5069];

    const stats = {
        total: arbolesFiltrados.length,
        produccion: arbolesFiltrados.filter(a => a.estado === "Produccion").length,
        enfermos: arbolesFiltrados.filter(a => a.estado === "Enfermo").length,
        crecimiento: arbolesFiltrados.filter(a => a.estado === "Crecimiento").length,
    };

    // ── Handlers perímetro ───────────────────────────────────
    const agregarPunto = (latlng: LatLng) => {
        setPuntosNuevos(prev => [...prev, { lat: latlng.lat, lng: latlng.lng }]);
    };

    const guardarPerimetroNuevo = async () => {
        if (!fincaId || puntosNuevos.length < 3) return;
        setGuardandoPerim(true);
        setMsgPerimetro("");
        try {
            await guardarPerimetro(fincaId, puntosNuevos);
            setMsgPerimetro("✓ Perímetro guardado.");
            setPuntosNuevos([]);
            setModoPerimetro(false);
            await cargarMapa(fincaId);
        } catch {
            setMsgPerimetro("Error al guardar el perímetro.");
        } finally {
            setGuardandoPerim(false);
        }
    };

    // ─────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24, gap: 12 }}>

            {/* Encabezado */}
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

                    <button
                        onClick={() => {
                            setModoPerimetro(v => !v);
                            setPuntosNuevos([]);
                            setMsgPerimetro("");
                        }}
                        style={{
                            ...btnStyle,
                            background: modoPerimetro ? "#185FA5" : "transparent",
                            color: modoPerimetro ? "#fff" : "#185FA5",
                            borderColor: "#185FA5",
                        }}
                    >
                        {modoPerimetro ? "✕ Cancelar dibujo" : "Dibujar perímetro"}
                    </button>

                    <button
                        onClick={() => setModalCoords(true)}
                        style={{ ...btnStyle, borderColor: "#b45309", color: "#b45309" }}
                    >
                        Coordenadas de origen
                    </button>
                </div>
            </div>

            {/* Banner modo dibujo */}
            {modoPerimetro && (
                <div style={{
                    background: "#ddeef8", border: "0.5px solid #185FA5",
                    borderRadius: 10, padding: "10px 16px",
                    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                }}>
                    <span style={{ fontSize: 13, color: "#0C447C", fontWeight: 500 }}>
                        Modo dibujo — hacé click en el mapa para marcar cada esquina del terreno
                    </span>
                    <span style={{ fontSize: 12, color: "#185FA5", background: "#fff", padding: "2px 10px", borderRadius: 20, border: "0.5px solid #185FA5" }}>
                        {puntosNuevos.length} punto{puntosNuevos.length !== 1 ? "s" : ""}
                    </span>
                    <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                        <button
                            onClick={() => setPuntosNuevos(p => p.slice(0, -1))}
                            disabled={puntosNuevos.length === 0}
                            style={{ ...btnSmall, background: "#888", opacity: puntosNuevos.length === 0 ? 0.4 : 1 }}
                        >← Deshacer</button>
                        <button onClick={() => setPuntosNuevos([])} style={{ ...btnSmall, background: "#c0392b" }}>
                            Limpiar
                        </button>
                        <button
                            onClick={guardarPerimetroNuevo}
                            disabled={puntosNuevos.length < 3 || guardandoPerim}
                            style={{ ...btnSmall, background: "#185FA5", opacity: puntosNuevos.length < 3 ? 0.5 : 1 }}
                        >
                            {guardandoPerim ? "Guardando..." : `Guardar (${puntosNuevos.length} pts)`}
                        </button>
                    </div>
                    {msgPerimetro && (
                        <p style={{ margin: 0, fontSize: 12, color: msgPerimetro.startsWith("✓") ? "#2d6a2d" : "#c0392b", width: "100%" }}>
                            {msgPerimetro}
                        </p>
                    )}
                </div>
            )}

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
                {finca && !finca.fin_latitud_origen && (
                    <div style={{
                        background: "#fef3c7", borderRadius: 10, padding: "8px 14px",
                        border: "0.5px solid #e67e22", display: "flex", alignItems: "center",
                        gap: 8, fontSize: 12, color: "#b45309",
                    }}>
                        ⚠ Esta finca no tiene coordenadas de origen — los árboles no se pueden calcular.
                        <button onClick={() => setModalCoords(true)} style={{ ...btnSmall, background: "#b45309" }}>
                            Configurar
                        </button>
                    </div>
                )}
            </div>

            {error && <p style={{ color: "#c0392b", margin: 0 }}>{error}</p>}
            {loading && <p style={{ color: "#7a9a7a", margin: 0 }}>Cargando mapa...</p>}

            {/* Mapa */}
            <div style={{ flex: 1, minHeight: 460, borderRadius: 16, overflow: "hidden", border: "0.5px solid #e8e0d0" }}>
                <MapContainer
                    key={`mapa-${fincaId}`}
                    center={centro}
                    zoom={ZOOM_INICIAL}
                    maxZoom={19}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom
                >
                    <ControlMapa modoPerimetro={modoPerimetro} onPunto={agregarPunto} />

                    <LayersControl position="topright">
                        <BaseLayer checked name="Mapa de calles">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                maxZoom={19}
                            />
                        </BaseLayer>
                        <BaseLayer name="Satelital">
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="&copy; Esri"
                                maxZoom={19}
                            />
                        </BaseLayer>
                    </LayersControl>

                    {/* Perímetro guardado */}
                    {poligonoGuardado.length >= 3 && (
                        <Polygon
                            positions={poligonoGuardado}
                            pathOptions={{ color: "#4a7c59", fillColor: "#4a7c59", fillOpacity: 0.08, weight: 2, dashArray: "6 4" }}
                        >
                            <Tooltip sticky>{finca?.fin_nombre}</Tooltip>
                        </Polygon>
                    )}

                    {/* Perímetro en construcción */}
                    {modoPerimetro && poligonoNuevo.length >= 2 && (
                        <Polygon
                            positions={poligonoNuevo}
                            pathOptions={{ color: "#185FA5", fillColor: "#185FA5", fillOpacity: 0.10, weight: 2, dashArray: "4 3" }}
                        />
                    )}

                    {/* Puntos numerados en construcción */}
                    {modoPerimetro && puntosNuevos.map((p, i) => (
                        <CircleMarker key={`np-${i}`} center={[p.lat, p.lng]} radius={7}
                            pathOptions={{ fillColor: "#185FA5", color: "#fff", fillOpacity: 1, weight: 2 }}
                        >
                            <Tooltip permanent direction="top" offset={[0, -8]}>
                                <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                            </Tooltip>
                        </CircleMarker>
                    ))}

                    {/* Árboles */}
                    {arbolesFiltrados.map(arbol => (
                        <CircleMarker key={arbol.id} center={[arbol.lat, arbol.lng]} radius={6}
                            pathOptions={{
                                fillColor: COLORES_ESTADO[arbol.estado] ?? "#888",
                                color: "#fff", fillOpacity: 1, weight: 1.5,
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
                                                ["Pos.", `${arbol.lat.toFixed(5)}, ${arbol.lng.toFixed(5)}`],
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

                    {/* Cuarentena */}
                    {cuarentena && arbolesEnfermos.flatMap(a => [
                        <Circle key={`c5-${a.id}`} center={[a.lat, a.lng]} radius={5}
                            pathOptions={{ color: "#c0392b", fillColor: "#c0392b", fillOpacity: 0.10, weight: 1.5, dashArray: "4 3" }} />,
                        <Circle key={`c10-${a.id}`} center={[a.lat, a.lng]} radius={10}
                            pathOptions={{ color: "#e67e22", fillColor: "#e67e22", fillOpacity: 0.06, weight: 1, dashArray: "4 3" }} />,
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
            </div>

            {/* ── Modal coordenadas de origen ─────────────────── */}
            {modalCoords && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 16, padding: 28,
                        width: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
                    }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d4a2d", margin: "0 0 6px" }}>
                            Configurar origen de la finca
                        </h2>
                        <p style={{ fontSize: 13, color: "#7a9a7a", margin: "0 0 20px", lineHeight: 1.6 }}>
                            Este punto es la esquina <strong>noroeste (NW)</strong> de la finca — desde ahí se calculan las posiciones de todos los árboles.
                            Podés obtenerlo en <strong>Google Maps</strong>: click derecho → "¿Qué hay aquí?" → copiar lat/lng.
                        </p>

                        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle2}>Latitud</label>
                                <input
                                    type="number" step="0.00001"
                                    value={coordsForm.lat}
                                    onChange={e => setCoordsForm({ ...coordsForm, lat: e.target.value })}
                                    placeholder="Ej: 14.63492"
                                    style={inputStyle2}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle2}>Longitud</label>
                                <input
                                    type="number" step="0.00001"
                                    value={coordsForm.lng}
                                    onChange={e => setCoordsForm({ ...coordsForm, lng: e.target.value })}
                                    placeholder="Ej: -90.50689"
                                    style={inputStyle2}
                                />
                            </div>
                        </div>

                        <div style={{ background: "#f5f0e8", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#5F5E5A", marginBottom: 20 }}>
                            <strong>¿Cómo obtener las coordenadas?</strong><br />
                            1. Abrí Google Maps en tu computadora<br />
                            2. Buscá el terreno de la finca<br />
                            3. Click derecho en la esquina noroeste<br />
                            4. Copiá los números que aparecen arriba (ej: 14.63492, -90.50689)
                        </div>

                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button onClick={() => setModalCoords(false)} style={btnCancelStyle}>
                                Cancelar
                            </button>
                            <button
                                onClick={guardarCoords}
                                disabled={guardandoCoords || !coordsForm.lat || !coordsForm.lng}
                                style={{ ...btnSmall, background: "#4a7c59", padding: "10px 20px", fontSize: 14, opacity: guardandoCoords ? 0.6 : 1 }}
                            >
                                {guardandoCoords ? "Guardando..." : "Guardar y cargar mapa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
const btnSmall: React.CSSProperties = {
    fontSize: 12, padding: "6px 14px",
    border: "none", borderRadius: 8,
    color: "#fff", cursor: "pointer", fontWeight: 500,
};
const labelStyle2: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600,
    color: "#7a9a7a", textTransform: "uppercase",
    letterSpacing: 1, marginBottom: 4,
};
const inputStyle2: React.CSSProperties = {
    width: "100%", padding: "9px 12px", fontSize: 14,
    border: "1.5px solid #c8d8c0", borderRadius: 8,
    background: "#f9f6f0", color: "#2d4a2d", outline: "none",
    boxSizing: "border-box",
};
const btnCancelStyle: React.CSSProperties = {
    padding: "10px 20px", fontSize: 14, background: "#f0ece4",
    color: "#6b8c6b", border: "none", borderRadius: 8, cursor: "pointer",
};
const popupBtnStyle: React.CSSProperties = {
    marginTop: 10, width: "100%", padding: "6px",
    fontSize: 11, borderRadius: 6, border: "none",
    background: "#4a7c59", color: "#fff",
    cursor: "pointer", fontWeight: 600,
};

export default AgroMapaPage;