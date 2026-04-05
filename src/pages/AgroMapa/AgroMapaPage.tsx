import { useEffect, useState, useCallback } from "react";
import {
    MapContainer, TileLayer, CircleMarker, Polygon,
    Popup, Circle, Tooltip, LayersControl, useMapEvents, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "leaflet";
import { getMapaFinca, getFincas, guardarPerimetro } from "../../api/agroFincaMapa.api";
import type { Finca, ArbolMapa, PuntoPerimetro } from "./agroMapa.types";
import { COLORES_ESTADO, ZOOM_INICIAL } from "./agroMapa.types";

const { BaseLayer } = LayersControl;

// ─────────────────────────────────────────────────────────────
// Constante de espaciado fija
// ─────────────────────────────────────────────────────────────
const ESPACIADO_METROS = 2;
const GRADO_POR_METRO = 0.000009; // 1m ≈ 0.000009 grados

// ─────────────────────────────────────────────────────────────
// Pasos del wizard
// ─────────────────────────────────────────────────────────────
type Paso = "idle" | "coords" | "dibujando" | "preview" | "guardando" | "listo";

interface ArbolPreview {
    lat: number;
    lng: number;
    surco: number;
    posicion: number;
}

// ─────────────────────────────────────────────────────────────
// Ray Casting — punto dentro de polígono
// ─────────────────────────────────────────────────────────────
function puntoEnPoligono(lat: number, lng: number, poly: { lat: number; lng: number }[]): boolean {
    let inside = false;
    const n = poly.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = poly[i].lng, yi = poly[i].lat;
        const xj = poly[j].lng, yj = poly[j].lat;
        if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
            inside = !inside;
    }
    return inside;
}

// ─────────────────────────────────────────────────────────────
// Genera grilla de árboles dentro del polígono a 2m
// ─────────────────────────────────────────────────────────────
function generarGrilla(poly: { lat: number; lng: number }[]): ArbolPreview[] {
    const paso = ESPACIADO_METROS * GRADO_POR_METRO;
    const lats = poly.map(p => p.lat);
    const lngs = poly.map(p => p.lng);
    const arboles: ArbolPreview[] = [];
    let numSurco = 1;

    for (let lng = Math.min(...lngs); lng <= Math.max(...lngs); lng += paso) {
        let posicion = 1;
        let haySurco = false;
        for (let lat = Math.min(...lats); lat <= Math.max(...lats); lat += paso) {
            if (puntoEnPoligono(lat, lng, poly)) {
                arboles.push({ lat, lng, surco: numSurco, posicion });
                posicion++;
                haySurco = true;
            }
        }
        if (haySurco) numSurco++;
    }
    return arboles;
}

// ─────────────────────────────────────────────────────────────
// Control del mapa — cursor crosshair + clicks
// ─────────────────────────────────────────────────────────────
const ControlMapa = ({ activo, onPunto }: { activo: boolean; onPunto: (ll: LatLng) => void }) => {
    const map = useMap();
    useEffect(() => {
        if (activo) { map.dragging.disable(); map.getContainer().style.cursor = "crosshair"; }
        else { map.dragging.enable(); map.getContainer().style.cursor = ""; }
        return () => { map.dragging.enable(); map.getContainer().style.cursor = ""; };
    }, [activo, map]);
    useMapEvents({ click(e) { if (activo) onPunto(e.latlng); } });
    return null;
};

// ─────────────────────────────────────────────────────────────
// WizardPanel — contenedor visual de cada paso
// ─────────────────────────────────────────────────────────────
const WizardPanel = ({
    paso, totalPasos, titulo, descripcion, color, children,
}: {
    paso: number; totalPasos: number; titulo: string;
    descripcion?: string; color: string; children?: React.ReactNode;
}) => (
    <div style={{
        background: "#fff",
        borderLeft: `4px solid ${color}`,
        border: `1px solid ${color}22`,
        borderRadius: 12, padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 10,
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: totalPasos }).map((_, i) => (
                    <div key={i} style={{
                        height: 6, borderRadius: 3,
                        width: i + 1 === paso ? 24 : 8,
                        background: i + 1 <= paso ? color : "#e0e0e0",
                        transition: "all 0.3s ease",
                    }} />
                ))}
            </div>
            <span style={{ fontSize: 10, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                Paso {paso} de {totalPasos}
            </span>
        </div>
        <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#2d4a2d" }}>{titulo}</p>
            {descripcion && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#7a9a7a" }}>{descripcion}</p>}
        </div>
        {children}
    </div>
);

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
const AgroMapaPage = () => {

    // ── Datos base ───────────────────────────────────────────
    const [fincas, setFincas] = useState<Finca[]>([]);
    const [fincaId, setFincaId] = useState<number | null>(null);
    const [finca, setFinca] = useState<Finca | null>(null);
    const [arboles, setArboles] = useState<ArbolMapa[]>([]);
    const [perimetro, setPerimetro] = useState<PuntoPerimetro[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ── Filtros ──────────────────────────────────────────────
    const [filtroEstado, setFiltroEstado] = useState("all");
    const [filtroSeccion, setFiltroSeccion] = useState("all");
    const [cuarentena, setCuarentena] = useState(false);

    // ── Wizard ───────────────────────────────────────────────
    const [paso, setPaso] = useState<Paso>("idle");
    const [puntosNuevos, setPuntosNuevos] = useState<{ lat: number; lng: number }[]>([]);
    const [arbolesPreview, setArbolesPreview] = useState<ArbolPreview[]>([]);
    const [progreso, setProgreso] = useState(0);
    const [msgWizard, setMsgWizard] = useState("");

    // ── Coordenadas de origen ────────────────────────────────
    const [coordsForm, setCoordsForm] = useState({ lat: "", lng: "" });
    const [guardandoCoords, setGuardandoCoords] = useState(false);

    // ─────────────────────────────────────────────────────────
    // Reset del wizard
    // ─────────────────────────────────────────────────────────
    const resetWizard = () => {
        setPaso("idle");
        setPuntosNuevos([]);
        setArbolesPreview([]);
        setMsgWizard("");
        setProgreso(0);
    };

    // ─────────────────────────────────────────────────────────
    // FIX: Carga de datos SIN resetear el wizard
    // Usada internamente cuando no queremos interrumpir el flujo
    // ─────────────────────────────────────────────────────────
    const cargarDatosMapa = useCallback(async (id: number) => {
        setLoading(true);
        setError("");
        try {
            const data = await getMapaFinca(id);
            setFinca(data.finca);
            setArboles(data.arboles);
            setPerimetro(data.perimetro);
            return data;
        } catch (e: any) {
            if (e?.response?.status === 400) {
                setFinca((prev) => prev); // mantiene la finca actual si ya estaba seteada
                setArboles([]);
                setPerimetro([]);
                return null;
            } else {
                setError("Error al cargar el mapa");
                return null;
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // ─────────────────────────────────────────────────────────
    // Carga completa del mapa (incluye reset del wizard)
    // Usada al cambiar de finca o al inicializar
    // ─────────────────────────────────────────────────────────
    const cargarMapa = useCallback(async (id: number) => {
        setLoading(true);
        setError("");
        resetWizard();
        try {
            const data = await getMapaFinca(id);
            setFinca(data.finca);
            setArboles(data.arboles);
            setPerimetro(data.perimetro);
            if (!data.finca.fin_latitud_origen || !data.finca.fin_longitud_origen) {
                setCoordsForm({ lat: "14.6349", lng: "-90.5069" });
                setPaso("coords");
            }
        } catch (e: any) {
            if (e?.response?.status === 400) {
                setFinca(fincas.find(f => f.fin_finca === id) ?? null);
                setArboles([]);
                setPerimetro([]);
                setCoordsForm({ lat: "14.6349", lng: "-90.5069" });
                setPaso("coords");
            } else {
                setError("Error al cargar el mapa");
            }
        } finally {
            setLoading(false);
        }
    }, [fincas]);

    useEffect(() => {
        getFincas()
            .then((data: Finca[]) => {
                setFincas(data);
                if (data.length > 0) setFincaId(data[0].fin_finca);
            })
            .catch(() => setError("Error al cargar fincas"));
    }, []);

    useEffect(() => { if (fincaId) cargarMapa(fincaId); }, [fincaId]);

    // ─────────────────────────────────────────────────────────
    // Paso 1a — Guardar coordenadas de origen
    // ─────────────────────────────────────────────────────────
    const guardarCoords = async () => {
        if (!fincaId || !coordsForm.lat || !coordsForm.lng) return;
        setGuardandoCoords(true);
        try {
            const { default: api } = await import("../../api/Axios");
            await api.put(`/agro-finca/${fincaId}`, {
                fin_latitud_origen: Number(coordsForm.lat),
                fin_longitud_origen: Number(coordsForm.lng),
            });
            await cargarMapa(fincaId);
            setPaso("dibujando");
        } catch {
            alert("Error al guardar las coordenadas");
        } finally {
            setGuardandoCoords(false);
        }
    };

    // ─────────────────────────────────────────────────────────
    // Paso 1b — Guardar perímetro dibujado
    //           + generar preview automático a 2m
    //
    // FIX: Se usa cargarDatosMapa() en lugar de cargarMapa()
    //      para NO resetear el wizard y no borrar arbolesPreview.
    //      El preview se setea ANTES de refrescar el mapa.
    // ─────────────────────────────────────────────────────────
    const guardarPerimetroYPreview = async () => {
        if (!fincaId || puntosNuevos.length < 3) return;
        setMsgWizard("");

        try {
            // 1. Guardar perímetro en BD
            await guardarPerimetro(fincaId, puntosNuevos);

            // 2. Generar grilla ANTES de que cualquier setState lo limpie
            const puntosSnapshot = [...puntosNuevos]; // snapshot defensivo
            const preview = generarGrilla(puntosSnapshot);

            console.log("[AgroMapa] Puntos del polígono:", puntosSnapshot.length);
            console.log("[AgroMapa] Árboles generados en preview:", preview.length);

            if (preview.length === 0) {
                setMsgWizard("El perímetro es muy pequeño para el espaciado de 2m. Intentá con un terreno más grande.");
                return;
            }

            // 3. Setear preview y avanzar al paso ANTES de refrescar datos
            setArbolesPreview(preview);
            setPaso("preview");

            // 4. Refrescar solo el perímetro/árboles del mapa sin tocar el wizard
            await cargarDatosMapa(fincaId);

        } catch (err) {
            console.error("[AgroMapa] Error al guardar perímetro:", err);
            setMsgWizard("Error al guardar el perímetro.");
        }
    };

    // ─────────────────────────────────────────────────────────
    // Paso 2 — Confirmar y guardar surcos + árboles en BD
    // ─────────────────────────────────────────────────────────
    const confirmarGuardar = async () => {
        if (!fincaId || arbolesPreview.length === 0) return;
        setPaso("guardando");
        setProgreso(0);
        setMsgWizard("");
        try {
            const { default: api } = await import("../../api/Axios");

            // 1. Primera sección activa de la finca
            const resSec = await api.get("/agro-seccion");
            const secciones: any[] = resSec.data.secciones ?? [];
            const seccionFinca = secciones.find((s: any) => s.fin_finca === fincaId);

            if (!seccionFinca) {
                setMsgWizard("⚠ La finca no tiene secciones. Crea al menos una sección primero.");
                setPaso("preview");
                return;
            }

            // 2. Crear surcos (uno por columna de la grilla)
            const surcosUnicos = [...new Set(arbolesPreview.map(a => a.surco))];
            const surcoIdMap: Record<number, number> = {};

            for (let i = 0; i < surcosUnicos.length; i++) {
                const num = surcosUnicos[i];
                const r = await api.post("/agro-surcos", {
                    sur_numero_surco: num,
                    sur_orientacion: "Norte-Sur",
                    sur_espaciamiento: ESPACIADO_METROS,
                    secc_secciones: seccionFinca.secc_seccion,
                    sur_activo: 1,
                });
                surcoIdMap[num] = r.data.surco?.sur_surco;
                setProgreso(Math.round(((i + 1) / surcosUnicos.length) * 35));
            }

            // 3. Tipo árbol por defecto (primero disponible)
            const resTipos = await api.get("/agro-tipo-arbol");
            const tipoDefault = resTipos.data.tipos?.[0]?.tipar_tipo_arbol ?? 1;
            const hoy = new Date().toISOString().slice(0, 10);

            // 4. Insertar árboles en lotes de 20
            const LOTE = 20;
            for (let i = 0; i < arbolesPreview.length; i += LOTE) {
                await Promise.all(
                    arbolesPreview.slice(i, i + LOTE).map(a =>
                        api.post("/agro-arboles", {
                            arb_posicion_surco: a.posicion,
                            arb_fecha_siembra: hoy,
                            tipar_tipo_arbol: tipoDefault,
                            arb_estado: "Crecimiento",
                            sur_surcos: surcoIdMap[a.surco],
                            arb_activo: 1,
                        })
                    )
                );
                setProgreso(35 + Math.min(Math.round(((i + LOTE) / arbolesPreview.length) * 65), 64));
            }

            setProgreso(100);
            setMsgWizard(
                `✓ ${arbolesPreview.length.toLocaleString()} árboles · ${surcosUnicos.length} surcos · sección: "${seccionFinca.secc_nombre}"`
            );
            setArbolesPreview([]);
            setPaso("listo");

            setTimeout(async () => {
                resetWizard();
                if (fincaId) await cargarMapa(fincaId);
            }, 2500);

        } catch (err) {
            console.error(err);
            setMsgWizard("Error al guardar. Revisá la consola.");
            setPaso("preview");
        }
    };

    // ─────────────────────────────────────────────────────────
    // Datos derivados
    // ─────────────────────────────────────────────────────────
    const seccionesUnicas = [...new Set(arboles.map(a => a.seccion_nombre))];
    const arbolesFiltrados = arboles.filter(a =>
        (filtroEstado === "all" || a.estado === filtroEstado) &&
        (filtroSeccion === "all" || a.seccion_nombre === filtroSeccion)
    );
    const arbolesEnfermos = arboles.filter(a => a.estado === "Enfermo");
    const poligonoGuardado = perimetro.sort((a, b) => a.orden - b.orden).map(p => [p.lat, p.lng] as [number, number]);
    const poligonoEnDibujo = puntosNuevos.map(p => [p.lat, p.lng] as [number, number]);
    const centro: [number, number] = finca?.fin_latitud_origen
        ? [finca.fin_latitud_origen, finca.fin_longitud_origen]
        : [14.6349, -90.5069];

    const stats = {
        total: arbolesFiltrados.length,
        produccion: arbolesFiltrados.filter(a => a.estado === "Produccion").length,
        enfermos: arbolesFiltrados.filter(a => a.estado === "Enfermo").length,
        crecimiento: arbolesFiltrados.filter(a => a.estado === "Crecimiento").length,
    };

    const estaEnWizard = paso !== "idle" && paso !== "listo";

    // ─────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: 24, gap: 12 }}>

            {/* ── ENCABEZADO ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>Mapa de Finca</h1>
                    <p style={{ fontSize: 13, color: "#7a9a7a", margin: "2px 0 0" }}>
                        {finca ? `${finca.fin_nombre} — ${arboles.length} árboles` : "Selecciona una finca"}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <select value={fincaId ?? ""} onChange={e => setFincaId(Number(e.target.value))}
                        style={selectStyle} disabled={estaEnWizard}>
                        {fincas.map(f => <option key={f.fin_finca} value={f.fin_finca}>{f.fin_nombre}</option>)}
                    </select>
                    <select value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)} style={selectStyle}>
                        <option value="all">Todas las secciones</option>
                        {seccionesUnicas.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {(["all", "Produccion", "Enfermo", "Crecimiento"] as const).map(e => (
                        <button key={e} onClick={() => setFiltroEstado(e)} style={{
                            ...btnOutline,
                            background: filtroEstado === e ? "#4a7c59" : "transparent",
                            color: filtroEstado === e ? "#fff" : "#2d4a2d",
                            borderColor: filtroEstado === e ? "#4a7c59" : "#c8d8c0",
                        }}>
                            {e === "all" ? "Todos" : e}
                        </button>
                    ))}
                    <button onClick={() => setCuarentena(v => !v)} style={{
                        ...btnOutline,
                        background: cuarentena ? "#c0392b" : "transparent",
                        color: cuarentena ? "#fff" : "#c0392b", borderColor: "#c0392b",
                    }}>Cuarentena</button>

                    {/* Iniciar wizard */}
                    {paso === "idle" && (
                        <button onClick={() => {
                            if (!finca?.fin_latitud_origen) { setPaso("coords"); }
                            else { setPuntosNuevos([]); setPaso("dibujando"); }
                        }} style={{ ...btnPrimary, background: "#185FA5" }}>
                            + Configurar terreno
                        </button>
                    )}

                    {/* Cancelar wizard */}
                    {estaEnWizard && (
                        <button onClick={resetWizard} style={{
                            ...btnOutline, color: "#c0392b", borderColor: "#c0392b",
                        }}>✕ Cancelar</button>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                WIZARD PANELS
            ══════════════════════════════════════════════ */}

            {/* PASO coords */}
            {paso === "coords" && (
                <WizardPanel paso={1} totalPasos={2} color="#b45309"
                    titulo="Paso 1 — Configura el punto de origen de la finca"
                    descripcion="Ingresá las coordenadas de la esquina noroeste (NW) del terreno. Podés obtenerlas haciendo click derecho en Google Maps.">
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div>
                            <label style={labelStyle}>Latitud</label>
                            <input type="number" step="0.00001" value={coordsForm.lat}
                                onChange={e => setCoordsForm({ ...coordsForm, lat: e.target.value })}
                                placeholder="Ej: 14.63492" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Longitud</label>
                            <input type="number" step="0.00001" value={coordsForm.lng}
                                onChange={e => setCoordsForm({ ...coordsForm, lng: e.target.value })}
                                placeholder="Ej: -90.50689" style={inputStyle} />
                        </div>
                        <button onClick={guardarCoords}
                            disabled={guardandoCoords || !coordsForm.lat || !coordsForm.lng}
                            style={{ ...btnPrimary, opacity: guardandoCoords ? 0.6 : 1 }}>
                            {guardandoCoords ? "Guardando..." : "Guardar y trazar terreno →"}
                        </button>
                    </div>
                </WizardPanel>
            )}

            {/* PASO dibujando */}
            {paso === "dibujando" && (
                <WizardPanel paso={1} totalPasos={2} color="#185FA5"
                    titulo="Paso 1 — Marcá las esquinas del terreno en el mapa"
                    descripcion={`Hacé click sobre el mapa para agregar puntos. El sistema generará árboles cada ${ESPACIADO_METROS}m automáticamente.`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{
                            background: puntosNuevos.length >= 3 ? "#185FA5" : "#aaa",
                            color: "#fff", borderRadius: 20, padding: "3px 14px",
                            fontSize: 12, fontWeight: 600, transition: "background 0.2s",
                        }}>
                            {puntosNuevos.length} punto{puntosNuevos.length !== 1 ? "s" : ""}
                            {puntosNuevos.length < 3 ? ` (mínimo 3)` : " ✓"}
                        </span>
                        <button onClick={() => setPuntosNuevos(p => p.slice(0, -1))}
                            disabled={puntosNuevos.length === 0}
                            style={{ ...btnSecondary, opacity: puntosNuevos.length === 0 ? 0.4 : 1 }}>
                            ← Deshacer
                        </button>
                        <button onClick={() => setPuntosNuevos([])} style={btnDanger}>
                            Limpiar
                        </button>
                        <button onClick={guardarPerimetroYPreview}
                            disabled={puntosNuevos.length < 3}
                            style={{ ...btnPrimary, marginLeft: "auto", opacity: puntosNuevos.length < 3 ? 0.5 : 1 }}>
                            Guardar y generar árboles ({ESPACIADO_METROS}m) →
                        </button>
                    </div>
                    {msgWizard && <p style={{ fontSize: 12, color: "#c0392b", margin: "4px 0 0" }}>{msgWizard}</p>}
                </WizardPanel>
            )}

            {/* PASO preview */}
            {paso === "preview" && arbolesPreview.length > 0 && (
                <WizardPanel paso={2} totalPasos={2} color="#4a7c59"
                    titulo="Paso 2 — Confirmá los árboles generados">
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                        {/* Resumen */}
                        <div style={{ display: "flex", gap: 16 }}>
                            {[
                                { icon: "🌱", label: "Árboles", val: arbolesPreview.length.toLocaleString() },
                                { icon: "🌾", label: "Surcos", val: String(new Set(arbolesPreview.map(a => a.surco)).size) },
                                { icon: "📏", label: "Espaciado", val: `${ESPACIADO_METROS}m` },
                            ].map(item => (
                                <div key={item.label} style={{
                                    background: "#f0f7f0", borderRadius: 10,
                                    padding: "8px 16px", textAlign: "center",
                                }}>
                                    <div style={{ fontSize: 18 }}>{item.icon}</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#2d4a2d" }}>{item.val}</div>
                                    <div style={{ fontSize: 10, color: "#7a9a7a" }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: 12, color: "#5a7a5a", flex: 1, margin: 0 }}>
                            Los puntos verdes en el mapa muestran las posiciones calculadas.
                            Se asignarán a la primera sección de la finca.
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setArbolesPreview([]); setPaso("dibujando"); setPuntosNuevos([]); }}
                                style={btnSecondary}>
                                ← Redibujar
                            </button>
                            <button onClick={confirmarGuardar} style={btnPrimary}>
                                ✓ Guardar en BD
                            </button>
                        </div>
                    </div>
                    {msgWizard && <p style={{ fontSize: 12, color: "#c0392b", margin: "4px 0 0" }}>{msgWizard}</p>}
                </WizardPanel>
            )}

            {/* PASO guardando */}
            {paso === "guardando" && (
                <WizardPanel paso={2} totalPasos={2} color="#4a7c59" titulo="Guardando en la base de datos...">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#5a7a5a" }}>
                            <span>Creando surcos y árboles...</span>
                            <span style={{ fontWeight: 700, color: "#4a7c59" }}>{progreso}%</span>
                        </div>
                        <div style={{ background: "#e8f0e0", borderRadius: 8, height: 10, overflow: "hidden" }}>
                            <div style={{
                                height: "100%", background: "#4a7c59", borderRadius: 8,
                                width: `${progreso}%`, transition: "width 0.4s ease",
                            }} />
                        </div>
                    </div>
                </WizardPanel>
            )}

            {/* PASO listo */}
            {paso === "listo" && (
                <WizardPanel paso={2} totalPasos={2} color="#4a7c59" titulo="¡Terreno configurado exitosamente!">
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2d6a2d" }}>{msgWizard}</p>
                </WizardPanel>
            )}

            {/* ── STATS ── */}
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
                {arbolesPreview.length > 0 && (
                    <div style={{
                        background: "#f0f7f0", borderRadius: 10, padding: "8px 18px",
                        border: "1.5px dashed #4a7c59", textAlign: "center", minWidth: 80,
                    }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#4a7c59" }}>
                            {arbolesPreview.length.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: "#4a7c59", fontWeight: 600 }}>Preview</div>
                    </div>
                )}
            </div>

            {error && <p style={{ color: "#c0392b", margin: 0 }}>{error}</p>}
            {loading && <p style={{ color: "#7a9a7a", margin: 0 }}>Cargando mapa...</p>}

            {/* ── MAPA ── */}
            <div style={{ flex: 1, minHeight: 460, borderRadius: 16, overflow: "hidden", border: "0.5px solid #e8e0d0" }}>
                <MapContainer key={`mapa-${fincaId}`} center={centro} zoom={ZOOM_INICIAL}
                    maxZoom={19} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                    <ControlMapa
                        activo={paso === "dibujando"}
                        onPunto={ll => setPuntosNuevos(prev => [...prev, { lat: ll.lat, lng: ll.lng }])}
                    />

                    <LayersControl position="topright">
                        <BaseLayer checked name="Mapa de calles">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' maxZoom={19} />
                        </BaseLayer>
                        <BaseLayer name="Satelital">
                            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="&copy; Esri" maxZoom={19} />
                        </BaseLayer>
                    </LayersControl>

                    {/* Perímetro guardado */}
                    {poligonoGuardado.length >= 3 && (
                        <Polygon positions={poligonoGuardado}
                            pathOptions={{ color: "#4a7c59", fillColor: "#4a7c59", fillOpacity: 0.08, weight: 2, dashArray: "6 4" }}>
                            <Tooltip sticky>{finca?.fin_nombre}</Tooltip>
                        </Polygon>
                    )}

                    {/* Polígono en construcción */}
                    {paso === "dibujando" && poligonoEnDibujo.length >= 2 && (
                        <Polygon positions={poligonoEnDibujo}
                            pathOptions={{ color: "#185FA5", fillColor: "#185FA5", fillOpacity: 0.10, weight: 2, dashArray: "4 3" }} />
                    )}

                    {/* Puntos numerados del dibujo */}
                    {paso === "dibujando" && puntosNuevos.map((p, i) => (
                        <CircleMarker key={`np-${i}`} center={[p.lat, p.lng]} radius={7}
                            pathOptions={{ fillColor: "#185FA5", color: "#fff", fillOpacity: 1, weight: 2 }}>
                            <Tooltip permanent direction="top" offset={[0, -8]}>
                                <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                            </Tooltip>
                        </CircleMarker>
                    ))}

                    {/* Preview de árboles generados */}
                    {arbolesPreview.map((a, i) => (
                        <CircleMarker key={`prev-${i}`} center={[a.lat, a.lng]} radius={4}
                            pathOptions={{ fillColor: "#6aaa7a", color: "#fff", fillOpacity: 0.9, weight: 1 }}>
                            <Tooltip direction="top" offset={[0, -5]}>
                                <span style={{ fontSize: 11 }}>S{a.surco}-P{a.posicion} · preview</span>
                            </Tooltip>
                        </CircleMarker>
                    ))}

                    {/* Árboles reales de la BD */}
                    {arbolesFiltrados.map(arbol => (
                        <CircleMarker key={arbol.id} center={[arbol.lat, arbol.lng]} radius={6}
                            pathOptions={{
                                fillColor: COLORES_ESTADO[arbol.estado] ?? "#888",
                                color: "#fff", fillOpacity: 1, weight: 1.5,
                            }}>
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

            {/* ── LEYENDA ── */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#7a9a7a" }}>
                {Object.entries(COLORES_ESTADO).map(([estado, color]) => (
                    <span key={estado} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                        {estado}
                    </span>
                ))}
                {arbolesPreview.length > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#6aaa7a", display: "inline-block" }} />
                        Preview (sin guardar)
                    </span>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 14, height: 0, borderTop: "2px dashed #4a7c59", display: "inline-block" }} />
                    Perímetro guardado
                </span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────
const selectStyle: React.CSSProperties = {
    fontSize: 12, padding: "5px 10px", border: "0.5px solid #c8d8c0",
    borderRadius: 20, background: "#fff", color: "#2d4a2d", cursor: "pointer", outline: "none",
};
const btnOutline: React.CSSProperties = {
    fontSize: 12, padding: "5px 12px", border: "0.5px solid",
    borderRadius: 20, cursor: "pointer", transition: "all 0.15s",
};
const btnPrimary: React.CSSProperties = {
    fontSize: 13, padding: "8px 18px", border: "none", borderRadius: 8,
    background: "#4a7c59", color: "#fff", cursor: "pointer", fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
    fontSize: 12, padding: "7px 14px", border: "none", borderRadius: 8,
    background: "#e8f0e0", color: "#2d4a2d", cursor: "pointer", fontWeight: 500,
};
const btnDanger: React.CSSProperties = {
    fontSize: 12, padding: "7px 14px", border: "none", borderRadius: 8,
    background: "#fde8e0", color: "#a03020", cursor: "pointer", fontWeight: 500,
};
const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700, color: "#6b8c6b",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 4,
};
const inputStyle: React.CSSProperties = {
    padding: "8px 12px", fontSize: 14, border: "1.5px solid #c8d8c0",
    borderRadius: 8, background: "#f9f6f0", color: "#2d4a2d",
    outline: "none", boxSizing: "border-box",
};
const popupBtnStyle: React.CSSProperties = {
    marginTop: 10, width: "100%", padding: "6px", fontSize: 11,
    borderRadius: 6, border: "none", background: "#4a7c59",
    color: "#fff", cursor: "pointer", fontWeight: 600,
};

export default AgroMapaPage;