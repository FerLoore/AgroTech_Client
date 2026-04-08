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

const GRADO_POR_METRO = 0.000009;

type Paso = "idle" | "coords" | "dibujando" | "configurar" | "preview" | "sin-seccion" | "guardando" | "listo";

interface ArbolPreview {
    lat: number;
    lng: number;
    surco: number;
    posicion: number;
}

interface TipoArbol {
    tipar_tipo_arbol: number;
    tipar_nombre_comun: string;
}

interface SeccionFinca {
    secc_seccion: number;
    secc_nombre: string;
    secc_tipo_suelo: string;
}

// ─── Ray Casting ──────────────────────────────────────────────
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

// ─── Grilla de árboles (espaciado dinámico) ──────────────────
function generarGrilla(poly: { lat: number; lng: number }[], espaciado = 2, latOrigen: number, lngOrigen: number): ArbolPreview[] {
    const paso = espaciado * GRADO_POR_METRO;
    const lats = poly.map(p => p.lat);
    const lngs = poly.map(p => p.lng);
    const arboles: ArbolPreview[] = [];

    // Calcular el rango absoluto
    const minM = Math.floor((Math.min(...lngs) - lngOrigen) / paso);
    const maxM = Math.ceil((Math.max(...lngs) - lngOrigen) / paso);

    const minN = Math.floor((Math.min(...lats) - latOrigen) / paso);
    const maxN = Math.ceil((Math.max(...lats) - latOrigen) / paso);

    for (let m = minM; m <= maxM; m++) {
        let lng = lngOrigen + m * paso;
        for (let n = minN; n <= maxN; n++) {
            let lat = latOrigen + n * paso;
            if (puntoEnPoligono(lat, lng, poly)) {
                arboles.push({ lat, lng, surco: m, posicion: n });
            }
        }
    }
    return arboles;
}

// ─── Control crosshair ───────────────────────────────────────
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

// ─── Control para centrar el mapa ────────────────────────────
const MapUpdater = ({ lat, lng }: { lat: number; lng: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom(), { animate: true });
    }, [lat, lng, map]);
    return null;
};

// ─── Control de ubicación GPS ──────────────────────────────────
const LocationMarker = ({ onPos }: { onPos: (p: LatLng) => void }) => {
    const [position, setPosition] = useState<LatLng | null>(null);
    const map = useMap();

    useEffect(() => {
        map.locate({ watch: true, enableHighAccuracy: true });
    }, [map]);

    useMapEvents({
        locationfound(e) {
            setPosition(e.latlng);
            onPos(e.latlng);
        },
    });

    if (!position) return null;

    return (
        <CircleMarker center={position} radius={7} pathOptions={{ fillColor: "#3b82f6", color: "#fff", fillOpacity: 1, weight: 2 }}>
            <Tooltip permanent direction="top" offset={[0, -8]}>
                <span style={{ fontSize: 11, fontWeight: 700 }}>Tú</span>
            </Tooltip>
        </CircleMarker>
    );
};

// ─── WizardPanel ─────────────────────────────────────────────
const WizardPanel = ({
    paso, totalPasos, titulo, descripcion, color, children,
}: {
    paso: number; totalPasos: number; titulo: string;
    descripcion?: string; color: string; children?: React.ReactNode;
}) => (
    <div style={{
        background: "#fff", borderLeft: `4px solid ${color}`,
        border: `1px solid ${color}22`, borderRadius: 12, padding: "16px 20px",
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

    // ── Datos generales ──────────────────────────────────────
    const [fincas, setFincas] = useState<Finca[]>([]);
    const [fincaId, setFincaId] = useState<number | null>(null);
    const [finca, setFinca] = useState<Finca | null>(null);
    const [arboles, setArboles] = useState<ArbolMapa[]>([]);
    const [perimetro, setPerimetro] = useState<PuntoPerimetro[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // GPS 
    const [gpsPosition, setGpsPosition] = useState<LatLng | null>(null);
    const [centroManual, setCentroManual] = useState<[number, number] | null>(null);

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

    // ── Paso 1: coordenadas ──────────────────────────────────
    const [coordsForm, setCoordsForm] = useState({ lat: "", lng: "" });
    const [guardandoCoords, setGuardandoCoords] = useState(false);

    // ── Paso 3: configuración desde BD ──────────────────────
    const [tiposArbol, setTiposArbol] = useState<TipoArbol[]>([]);
    const [seccionesFinca, setSeccionesFinca] = useState<SeccionFinca[]>([]);
    const [seccionSeleccionada, setSeccionSeleccionada] = useState<number | null>(null);
    const [tipoArbolSeleccionado, setTipoArbolSeleccionado] = useState<number | null>(null);
    const [espaciadoSeleccionado, setEspaciadoSeleccionado] = useState<number>(2);
    const [cargandoConfig, setCargandoConfig] = useState(false);

    // ── Paso sin-seccion: creación inline ───────────────────
    const [seccionForm, setSeccionForm] = useState({ secc_nombre: "", secc_tipo_suelo: "Franco" });
    const [guardandoSeccion, setGuardandoSeccion] = useState(false);

    const TIPOS_SUELO = ["Franco", "Arcilloso", "Arenoso", "Limoso", "Franco-arcilloso", "Franco-arenoso"];

    // ─── Reset completo del wizard ───────────────────────────
    const resetWizard = () => {
        setPaso("idle");
        setPuntosNuevos([]);
        setArbolesPreview([]);
        setMsgWizard("");
        setProgreso(0);
        setSeccionForm({ secc_nombre: "", secc_tipo_suelo: "Franco" });
        setSeccionSeleccionada(null);
        setTipoArbolSeleccionado(null);
        setEspaciadoSeleccionado(2);
        setSeccionesFinca([]);
        setTiposArbol([]);
    };

    // ─── Carga mapa sin resetear wizard ─────────────────────
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
                setArboles([]);
                setPerimetro([]);
                return null;
            }
            setError("Error al cargar el mapa");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Carga mapa completa (resetea wizard) ────────────────
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

    // ─── Carga secciones y tipos de árbol desde BD ───────────
    const cargarConfiguracion = async (id: number) => {
        setCargandoConfig(true);
        setMsgWizard("");
        try {
            const { default: api } = await import("../../api/Axios");
            const [resSec, resTipos] = await Promise.all([
                api.get(`/agro-seccion?fincaId=${id}`),
                api.get("/agro-tipo-arbol"),
            ]);
            const secciones: SeccionFinca[] = resSec.data.secciones ?? [];
            const tipos: TipoArbol[] = resTipos.data.tipoArboles ?? [];

            setSeccionesFinca(secciones);
            setTiposArbol(tipos);

            if (secciones.length > 0) setSeccionSeleccionada(secciones[0].secc_seccion);
            if (tipos.length > 0) setTipoArbolSeleccionado(tipos[0].tipar_tipo_arbol);

            // Si no tiene secciones, ir a crearla primero
            if (secciones.length === 0) setPaso("sin-seccion");
            else setPaso("configurar");

        } catch {
            setMsgWizard("Error al cargar configuración. Intentá nuevamente.");
            setPaso("dibujando");
        } finally {
            setCargandoConfig(false);
        }
    };

    // ─── Confirmar configuración y generar grilla ────────────
    const confirmarConfiguracion = () => {
        if (!seccionSeleccionada || !tipoArbolSeleccionado) return;
        setMsgWizard("");
        const preview = generarGrilla(
            puntosNuevos,
            espaciadoSeleccionado,
            finca?.fin_latitud_origen ?? 14.6349,
            finca?.fin_longitud_origen ?? -90.5069
        );
        if (preview.length === 0) {
            setMsgWizard("El perímetro es muy pequeño para el espaciado configurado. Reducí el espaciado o dibujá un área más grande.");
            return;
        }
        setArbolesPreview(preview);
        setPaso("preview");
    };

    useEffect(() => {
        getFincas()
            .then((data: Finca[]) => {
                setFincas(data);
                if (data.length > 0) setFincaId(data[0].fin_finca);
            })
            .catch(() => setError("Error al cargar fincas"));
    }, []);

    useEffect(() => {
        if (fincaId) {
            setCentroManual(null); // Return to default finca center when switching
            cargarMapa(fincaId);
        }
    }, [fincaId]);

    // ─── Paso 1: guardar coordenadas ─────────────────────────
    const guardarCoords = async () => {
        if (!fincaId || !coordsForm.lat || !coordsForm.lng) return;
        setGuardandoCoords(true);
        try {
            const { default: api } = await import("../../api/Axios");

            // Reemplazamos coma por punto en caso de que su teclado introduzca coma decimal
            const latLimpia = Number(String(coordsForm.lat).replace(',', '.'));
            const lngLimpia = Number(String(coordsForm.lng).replace(',', '.'));

            await api.put(`/agro-finca/${fincaId}`, {
                fin_latitud_origen: latLimpia,
                fin_longitud_origen: lngLimpia,
            });
            // Usá cargarDatosMapa (no cargarMapa) para no resetear el wizard
            await cargarDatosMapa(fincaId);
            setPaso("dibujando"); // ahora sí llega limpio
        } catch (e: any) {
            console.error("Error completo:", e);
            alert("Error al guardar las coordenadas: " + (e.response?.data?.message || e.message));
        } finally {
            setGuardandoCoords(false);
        }
    };

    // ─── Paso 2: guardar perímetro → ir a configuración ──────
    const guardarPerimetroYConfigurar = async () => {
        if (!fincaId || puntosNuevos.length < 3) return;
        setMsgWizard("");
        try {
            await guardarPerimetro(fincaId, puntosNuevos);
            await cargarDatosMapa(fincaId);
            await cargarConfiguracion(fincaId);
        } catch {
            setMsgWizard("Error al guardar el perímetro.");
        }
    };

    // ─── Paso sin-seccion: crear sección y volver a config ───
    const crearSeccionYContinuar = async () => {
        if (!fincaId || !seccionForm.secc_nombre.trim()) return;
        setGuardandoSeccion(true);
        setMsgWizard("");
        try {
            const { default: api } = await import("../../api/Axios");
            await api.post("/agro-seccion", {
                secc_nombre: seccionForm.secc_nombre.trim(),
                fin_finca: fincaId,
                secc_tipo_suelo: seccionForm.secc_tipo_suelo,
            });
            setSeccionForm({ secc_nombre: "", secc_tipo_suelo: "Franco" });
            // Recargar configuración para que aparezca la sección recién creada
            await cargarConfiguracion(fincaId);
        } catch {
            setMsgWizard("Error al crear la sección. Intentá nuevamente.");
        } finally {
            setGuardandoSeccion(false);
        }
    };

    // ─── Paso 4: confirmar y guardar en BD ───────────────────
    const confirmarGuardar = async () => {
        if (!fincaId || arbolesPreview.length === 0) return;

        setPaso("guardando");
        setProgreso(0);

        try {
            const { default: api } = await import("../../api/Axios");
            const surcosUnicos = [...new Set(arbolesPreview.map(a => a.surco))];
            const surcoIdMap: Record<number, number> = {};

            // 1. Crear Surcos uno por uno para obtener IDs reales
            for (let i = 0; i < surcosUnicos.length; i++) {
                const num = surcosUnicos[i];
                const r = await api.post("/agro-surcos", {
                    sur_numero_surco: num,
                    sur_orientacion: "Norte-Sur",
                    sur_espaciamiento: espaciadoSeleccionado,
                    secc_secciones: seccionSeleccionada,
                    sur_activo: 1,
                });

                // Extraemos el ID que ahora sí viene gracias al fix del backend
                const idReal = r.data.surco?.sur_surco;
                if (!idReal) throw new Error(`El surco ${num} no generó ID`);

                surcoIdMap[num] = idReal;
                setProgreso(Math.round(((i + 1) / surcosUnicos.length) * 30));
            }

            // 2. Insertar Árboles en lotes pequeños (LOTE de 10 es más seguro para Oracle)
            const LOTE = 10;
            for (let i = 0; i < arbolesPreview.length; i += LOTE) {
                const chunk = arbolesPreview.slice(i, i + LOTE);

                // Usamos un for simple en lugar de Promise.all para no saturar Oracle
                for (const a of chunk) {
                    await api.post("/agro-arboles", {
                        arb_posicion_surco: a.posicion,
                        arb_fecha_siembra: new Date().toISOString().split('T')[0],
                        tipar_tipo_arbol: tipoArbolSeleccionado,
                        arb_estado: "Crecimiento",
                        sur_surcos: surcoIdMap[a.surco], // ID Real de Oracle
                        arb_activo: 1,
                    });
                }

                setProgreso(30 + Math.round(((i + LOTE) / arbolesPreview.length) * 70));
            }

            setMsgWizard("✓ ¡Guardado exitoso!");
            setPaso("listo");

            setTimeout(async () => {
                resetWizard();
                if (fincaId) await cargarDatosMapa(fincaId);
            }, 3000);

        } catch (err) {
            console.error(err);
            setMsgWizard("Error al guardar: revisa los IDs de los surcos.");
            setPaso("preview");
        }
    };

    // ─── Datos derivados ──────────────────────────────────────
    const seccionesUnicas = [...new Set(arboles.map(a => a.seccion_nombre))];
    const arbolesFiltrados = arboles.filter(a =>
        (filtroEstado === "all" || a.estado === filtroEstado) &&
        (filtroSeccion === "all" || a.seccion_nombre === filtroSeccion)
    );
    const arbolesEnfermos = arboles.filter(a => a.estado === "Enfermo");
    const poligonoGuardado = perimetro.sort((a, b) => a.orden - b.orden).map(p => [p.lat, p.lng] as [number, number]);
    const poligonoEnDibujo = puntosNuevos.map(p => [p.lat, p.lng] as [number, number]);
    const centro: [number, number] = finca?.fin_latitud_origen && finca?.fin_longitud_origen
        ? [finca.fin_latitud_origen, finca.fin_longitud_origen]
        : [14.6349, -90.5069];
    const centroActivo = centroManual ?? centro;

    const stats = {
        total: arbolesFiltrados.length,
        produccion: arbolesFiltrados.filter(a => a.estado === "Produccion").length,
        enfermos: arbolesFiltrados.filter(a => a.estado === "Enfermo").length,
        crecimiento: arbolesFiltrados.filter(a => a.estado === "Crecimiento").length,
    };

    const estaEnWizard = paso !== "idle" && paso !== "listo";

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

                    {gpsPosition && (
                        <button onClick={() => setCentroManual([gpsPosition.lat, gpsPosition.lng])}
                            style={{ ...btnOutline, background: "#eff6ff", color: "#1d4ed8", borderColor: "#3b82f6", fontWeight: "bold" }}>
                            📍 Encontrarme
                        </button>
                    )}

                    {paso === "idle" && (
                        <button onClick={() => {
                            if (!finca?.fin_latitud_origen) { setPaso("coords"); }
                            else { setPuntosNuevos([]); setPaso("dibujando"); }
                        }} style={{ ...btnPrimary, background: "#185FA5" }}>
                            + Configurar terreno
                        </button>
                    )}
                    {estaEnWizard && (
                        <button onClick={resetWizard} style={{ ...btnOutline, color: "#c0392b", borderColor: "#c0392b" }}>
                            ✕ Cancelar
                        </button>
                    )}
                </div>
            </div>

            {/* ══ WIZARD PANELS ══════════════════════════════════ */}

            {/* PASO 1 — Coordenadas */}
            {paso === "coords" && (
                <WizardPanel paso={1} totalPasos={4} color="#b45309"
                    titulo="Paso 1 — Configurá el punto de origen de la finca"
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

            {/* PASO 2 — Dibujar perímetro */}
            {paso === "dibujando" && (
                <WizardPanel paso={2} totalPasos={4} color="#185FA5"
                    titulo="Paso 2 — Marcá las esquinas del terreno en el mapa"
                    descripcion="Hacé click sobre el mapa para agregar puntos que definan el perímetro del terreno.">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{
                            background: puntosNuevos.length >= 3 ? "#185FA5" : "#aaa",
                            color: "#fff", borderRadius: 20, padding: "3px 14px",
                            fontSize: 12, fontWeight: 600, transition: "background 0.2s",
                        }}>
                            {puntosNuevos.length} punto{puntosNuevos.length !== 1 ? "s" : ""}
                            {puntosNuevos.length < 3 ? " (mínimo 3)" : " ✓"}
                        </span>
                        <button onClick={() => setPuntosNuevos(p => p.slice(0, -1))}
                            disabled={puntosNuevos.length === 0}
                            style={{ ...btnSecondary, opacity: puntosNuevos.length === 0 ? 0.4 : 1 }}>
                            ← Deshacer
                        </button>
                        <button onClick={() => setPuntosNuevos([])} style={btnDanger}>Limpiar</button>
                        <button onClick={guardarPerimetroYConfigurar}
                            disabled={puntosNuevos.length < 3 || cargandoConfig}
                            style={{ ...btnPrimary, marginLeft: "auto", opacity: puntosNuevos.length < 3 ? 0.5 : 1 }}>
                            {cargandoConfig ? "Cargando..." : "Continuar →"}
                        </button>
                    </div>
                    {msgWizard && <p style={{ fontSize: 12, color: "#c0392b", margin: "4px 0 0" }}>{msgWizard}</p>}
                </WizardPanel>
            )}

            {/* PASO 3 — Configurar sección y tipo de árbol desde BD */}
            {paso === "configurar" && (
                <WizardPanel paso={3} totalPasos={4} color="#7c3aed"
                    titulo="Paso 3 — Configurá la sección y el tipo de árbol"
                    descripcion="Esta información se asignará a todos los árboles que se generarán en la grilla.">

                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>

                        {/* Sección */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <label style={labelStyle}>Sección de la finca</label>
                            {seccionesFinca.length === 0 ? (
                                <p style={{ fontSize: 12, color: "#c0392b", margin: 0 }}>
                                    No hay secciones para esta finca.{" "}
                                    <button onClick={() => setPaso("sin-seccion")}
                                        style={{ background: "none", border: "none", color: "#185FA5", cursor: "pointer", textDecoration: "underline", fontSize: 12, padding: 0 }}>
                                        Crear una
                                    </button>
                                </p>
                            ) : (
                                <select
                                    value={seccionSeleccionada ?? ""}
                                    onChange={e => setSeccionSeleccionada(Number(e.target.value))}
                                    style={{ ...inputStyle, width: "100%", cursor: "pointer" }}>
                                    {seccionesFinca.map(s => (
                                        <option key={s.secc_seccion} value={s.secc_seccion}>
                                            {s.secc_nombre} — {s.secc_tipo_suelo}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Tipo de árbol */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <label style={labelStyle}>Tipo de árbol</label>
                            {tiposArbol.length === 0 ? (
                                <p style={{ fontSize: 12, color: "#c0392b", margin: 0 }}>
                                    No hay tipos registrados. Creá uno en{" "}
                                    <strong>Catálogos → Tipos de Árbol</strong>.
                                </p>
                            ) : (
                                <select
                                    value={tipoArbolSeleccionado ?? ""}
                                    onChange={e => setTipoArbolSeleccionado(Number(e.target.value))}
                                    style={{ ...inputStyle, width: "100%", cursor: "pointer" }}>
                                    {tiposArbol.map(t => (
                                        <option key={t.tipar_tipo_arbol} value={t.tipar_tipo_arbol}>
                                            {t.tipar_nombre_comun}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Espaciado */}
                        <div style={{ minWidth: 160 }}>
                            <label style={labelStyle}>Espaciado entre árboles</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input
                                    type="number" min={1} max={10} step={0.5}
                                    value={espaciadoSeleccionado}
                                    onChange={e => setEspaciadoSeleccionado(Number(e.target.value))}
                                    style={{ ...inputStyle, width: 80 }}
                                />
                                <span style={{ fontSize: 13, color: "#7a9a7a" }}>metros</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button onClick={() => { setPaso("dibujando"); setMsgWizard(""); }} style={btnSecondary}>
                            ← Redibujar
                        </button>
                        <button
                            onClick={confirmarConfiguracion}
                            disabled={!seccionSeleccionada || !tipoArbolSeleccionado}
                            style={{ ...btnPrimary, opacity: (!seccionSeleccionada || !tipoArbolSeleccionado) ? 0.5 : 1 }}>
                            Generar árboles →
                        </button>
                    </div>
                    {msgWizard && <p style={{ fontSize: 12, color: "#c0392b", margin: "4px 0 0" }}>{msgWizard}</p>}
                </WizardPanel>
            )}

            {/* PASO sin-seccion — Crear sección inline */}
            {paso === "sin-seccion" && (
                <WizardPanel paso={3} totalPasos={4} color="#b45309"
                    titulo="Paso 3 — Primero creá una sección para esta finca"
                    descripcion="La finca aún no tiene secciones. Completá los datos y continuará automáticamente.">

                    <div style={{
                        background: "#fef9ec", border: "1px solid #f0c040",
                        borderRadius: 8, padding: "10px 14px",
                        display: "flex", alignItems: "flex-start", gap: 10,
                    }}>
                        <span style={{ fontSize: 16, lineHeight: 1 }}>ℹ️</span>
                        <div style={{ fontSize: 12, color: "#7a5a00" }}>
                            <strong>¿Qué es una sección?</strong> Es una subdivisión del terreno
                            (ej: "Sector Norte", "Lote A"). Los árboles generados se asignarán a esta sección.
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div style={{ flex: 2, minWidth: 180 }}>
                            <label style={labelStyle}>Nombre de la sección *</label>
                            <input
                                type="text"
                                value={seccionForm.secc_nombre}
                                onChange={e => setSeccionForm({ ...seccionForm, secc_nombre: e.target.value })}
                                placeholder='Ej: "Sector Norte", "Lote A"'
                                style={{ ...inputStyle, width: "100%" }}
                                autoFocus
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                            <label style={labelStyle}>Tipo de suelo</label>
                            <select
                                value={seccionForm.secc_tipo_suelo}
                                onChange={e => setSeccionForm({ ...seccionForm, secc_tipo_suelo: e.target.value })}
                                style={{ ...inputStyle, width: "100%", cursor: "pointer" }}>
                                {TIPOS_SUELO.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setPaso("dibujando"); setMsgWizard(""); }} style={btnSecondary}>
                                ← Volver
                            </button>
                            <button
                                onClick={crearSeccionYContinuar}
                                disabled={guardandoSeccion || !seccionForm.secc_nombre.trim()}
                                style={{ ...btnPrimary, opacity: (!seccionForm.secc_nombre.trim() || guardandoSeccion) ? 0.6 : 1 }}>
                                {guardandoSeccion ? "Creando..." : "Crear y continuar →"}
                            </button>
                        </div>
                    </div>
                    {msgWizard && <p style={{ fontSize: 12, color: "#c0392b", margin: "4px 0 0" }}>{msgWizard}</p>}
                </WizardPanel>
            )}

            {/* PASO 4 — Preview */}
            {paso === "preview" && arbolesPreview.length > 0 && (
                <WizardPanel paso={4} totalPasos={4} color="#4a7c59"
                    titulo="Paso 4 — Confirmá los árboles generados">
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {[
                                { icon: "🌱", label: "Árboles", val: arbolesPreview.length.toLocaleString() },
                                { icon: "🌾", label: "Surcos", val: String(new Set(arbolesPreview.map(a => a.surco)).size) },
                                { icon: "📏", label: "Espaciado", val: `${espaciadoSeleccionado}m` },
                                {
                                    icon: "🗂️", label: "Sección",
                                    val: seccionesFinca.find(s => s.secc_seccion === seccionSeleccionada)?.secc_nombre ?? "—"
                                },
                                {
                                    icon: "🌳", label: "Tipo",
                                    val: tiposArbol.find(t => t.tipar_tipo_arbol === tipoArbolSeleccionado)?.tipar_nombre_comun ?? "—"
                                },
                            ].map(item => (
                                <div key={item.label} style={{
                                    background: "#f0f7f0", borderRadius: 10,
                                    padding: "8px 14px", textAlign: "center", minWidth: 70,
                                }}>
                                    <div style={{ fontSize: 16 }}>{item.icon}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#2d4a2d" }}>{item.val}</div>
                                    <div style={{ fontSize: 10, color: "#7a9a7a" }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                            <button onClick={() => { setPaso("configurar"); setArbolesPreview([]); }} style={btnSecondary}>
                                ← Reconfigurar
                            </button>
                            <button onClick={confirmarGuardar} style={btnPrimary}>
                                ✓ Guardar en BD
                            </button>
                        </div>
                    </div>
                    {msgWizard && <p style={{ fontSize: 12, color: "#c0392b", margin: "4px 0 0" }}>{msgWizard}</p>}
                </WizardPanel>
            )}

            {/* Guardando */}
            {paso === "guardando" && (
                <WizardPanel paso={4} totalPasos={4} color="#4a7c59" titulo="Guardando en la base de datos...">
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

            {/* Listo */}
            {paso === "listo" && (
                <WizardPanel paso={4} totalPasos={4} color="#4a7c59" titulo="¡Terreno configurado exitosamente!">
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
                <MapContainer key={`mapa-${fincaId}`} center={centroActivo} zoom={ZOOM_INICIAL}
                    maxZoom={24} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                    <MapUpdater lat={centroActivo[0]} lng={centroActivo[1]} />
                    <LocationMarker onPos={setGpsPosition} />
                    <ControlMapa
                        activo={paso === "dibujando"}
                        onPunto={ll => setPuntosNuevos(prev => [...prev, { lat: ll.lat, lng: ll.lng }])}
                    />
                    <LayersControl position="topright">
                        <BaseLayer checked name="Mapa de calles">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' maxZoom={24} maxNativeZoom={19} />
                        </BaseLayer>
                        <BaseLayer name="Satelital">
                            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="&copy; Esri" maxZoom={24} maxNativeZoom={19} />
                        </BaseLayer>
                    </LayersControl>

                    {poligonoGuardado.length >= 3 && (
                        <Polygon positions={poligonoGuardado}
                            pathOptions={{ color: "#4a7c59", fillColor: "#4a7c59", fillOpacity: 0.08, weight: 2, dashArray: "6 4" }}>
                            <Tooltip sticky>{finca?.fin_nombre}</Tooltip>
                        </Polygon>
                    )}
                    {paso === "dibujando" && poligonoEnDibujo.length >= 2 && (
                        <Polygon positions={poligonoEnDibujo}
                            pathOptions={{ color: "#185FA5", fillColor: "#185FA5", fillOpacity: 0.10, weight: 2, dashArray: "4 3" }} />
                    )}
                    {paso === "dibujando" && puntosNuevos.map((p, i) => (
                        <CircleMarker key={`np-${i}`} center={[p.lat, p.lng]} radius={7}
                            pathOptions={{ fillColor: "#185FA5", color: "#fff", fillOpacity: 1, weight: 2 }}>
                            <Tooltip permanent direction="top" offset={[0, -8]}>
                                <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                            </Tooltip>
                        </CircleMarker>
                    ))}
                    {arbolesPreview.map((a, i) => (
                        <CircleMarker key={`prev-${i}`} center={[a.lat, a.lng]} radius={4}
                            pathOptions={{ fillColor: "#6aaa7a", color: "#fff", fillOpacity: 0.9, weight: 1 }}>
                            <Tooltip direction="top" offset={[0, -5]}>
                                <span style={{ fontSize: 11 }}>S{a.surco}-P{a.posicion} · preview</span>
                            </Tooltip>
                        </CircleMarker>
                    ))}
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

// ─── Estilos ─────────────────────────────────────────────────
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