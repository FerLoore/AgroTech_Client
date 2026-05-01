
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import L from "leaflet";
import {
    MapContainer, TileLayer, CircleMarker, Polygon, Marker,
    Popup, Circle, Tooltip, LayersControl, useMapEvents, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "leaflet";
import { getMapaFinca, getFincas, guardarPerimetro } from "../../api/agroFincaMapa.api";
import type { Finca, ArbolMapa, PuntoPerimetro, SeccionStats } from "./agroMapa.types";
import { COLORES_ESTADO, ZOOM_INICIAL } from "./agroMapa.types";
import { Leaf, Layers, Ruler, Expand, FolderTree, TreePine, Plus, Flame, FileText } from "lucide-react";
import "leaflet.heat";
import { generatePDF } from "../../reports/core/PDFGenerator";
import AgroReportTemplate from "../../reports/templates/AgroReportTemplate";
import type { AgroReportData, ChartsData, ClimaticData } from "../../reports/types/report.types";
import { getAgroClimas } from "../../api/AgroClima.api";
import html2canvas from "html2canvas";

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
    tiene_arboles: number;
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
        const lng = lngOrigen + m * paso;
        for (let n = minN; n <= maxN; n++) {
            const lat = latOrigen + n * paso;
            if (puntoEnPoligono(lat, lng, poly)) {
                arboles.push({ lat, lng, surco: m, posicion: n });
            }
        }
    }
    return arboles;
}

// ─── Utilidades Geográficas ──────────────────────────────────
const vertexIcon = (index: number) => L.divIcon({
    html: `<div style="background:#185FA5; color:#fff; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; font-size:11px; font-weight:800; box-shadow:0 2px 6px rgba(0,0,0,0.3)">${index + 1}</div>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
});

function getDistancia(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): string {
    const d = L.latLng(p1.lat, p1.lng).distanceTo(L.latLng(p2.lat, p2.lng));
    return d < 1000 ? `${d.toFixed(1)}m` : `${(d / 1000).toFixed(2)}km`;
}

function getMidpoint(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): [number, number] {
    return [(p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2];
}

const MedidasPoligono = ({ puntos, color = "#4a7c59", cerrar = true }: { puntos: { lat: number; lng: number }[], color?: string, cerrar?: boolean }) => {
    if (puntos.length < 2) return null;
    const segmentos = [];
    for (let i = 0; i < puntos.length - 1; i++) {
        segmentos.push({ p1: puntos[i], p2: puntos[i + 1] });
    }
    if (cerrar && puntos.length > 2) {
        segmentos.push({ p1: puntos[puntos.length - 1], p2: puntos[0] });
    }

    return (
        <>
            {segmentos.map((seg, i) => (
                <CircleMarker
                    key={`seg-${i}`}
                    center={getMidpoint(seg.p1, seg.p2)}
                    radius={0}
                    pathOptions={{ fillOpacity: 0, stroke: false }}
                >
                    <Tooltip permanent direction="center" className="distancia-tooltip">
                        <span style={{
                            fontSize: 10, fontWeight: 800, color: "#fff",
                            background: color, padding: "2px 6px", borderRadius: 4,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.3)", border: "1px solid #fff"
                        }}>
                            {getDistancia(seg.p1, seg.p2)}
                        </span>
                    </Tooltip>
                </CircleMarker>
            ))}
        </>
    );
};

// ─── Control crosshair ───────────────────────────────────────
const ControlMapa = ({ activo, onPunto }: { activo: boolean; onPunto: (ll: LatLng) => void }) => {
    const map = useMap();

    useEffect(() => {
        if (!activo) {
            map.dragging.enable();
            map.getContainer().style.cursor = "";
            return;
        }

        const container = map.getContainer();
        container.style.cursor = "crosshair";
        map.dragging.disable(); // Deshabilitamos drag de click izquierdo

        let isRightDragging = false;
        let lastPos: { x: number, y: number } | null = null;

        const onMouseDown = (e: MouseEvent) => {
            if (e.button === 2) {
                isRightDragging = true;
                lastPos = { x: e.clientX, y: e.clientY };
                container.style.cursor = "grabbing";
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (isRightDragging && lastPos) {
                const dx = lastPos.x - e.clientX;
                const dy = lastPos.y - e.clientY;
                map.panBy([dx, dy], { animate: false });
                lastPos = { x: e.clientX, y: e.clientY };
            }
        };

        const onMouseUp = (e: MouseEvent) => {
            if (e.button === 2) {
                isRightDragging = false;
                lastPos = null;
                container.style.cursor = "crosshair";
            }
        };

        const onContextMenu = (e: MouseEvent) => e.preventDefault();

        container.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        container.addEventListener("contextmenu", onContextMenu);

        return () => {
            container.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            container.removeEventListener("contextmenu", onContextMenu);
            map.dragging.enable();
            container.style.cursor = "";
        };
    }, [activo, map]);

    useMapEvents({ click(e) { if (activo) onPunto(e.latlng); } });
    return null;
};

// ─── Control Origen ───────────────────────────────────────────
const ControlOrigen = ({ activo, onPunto }: { activo: boolean; onPunto: (ll: LatLng) => void }) => {
    useMapEvents({ click(e) { if (activo) onPunto(e.latlng); } });
    const map = useMap();
    useEffect(() => {
        if (activo) { map.getContainer().style.cursor = "crosshair"; }
        else { map.getContainer().style.cursor = ""; }
    }, [activo, map]);
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

// ─── Heatmap Layer ───────────────────────────────────────────
const HeatmapLayer = ({ points }: { points: [number, number, number][] }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || points.length === 0) return;

        const heat = L.heatLayer(points, {
            radius: 30,
            blur: 20,
            maxZoom: 18,
            max: 1.0,
            gradient: {
                0.4: 'blue',
                0.6: 'cyan',
                0.7: 'lime',
                0.8: 'yellow',
                1.0: 'red'
            }
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [map, points]);

    return null;
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
    const navigate = useNavigate();
    const location = useLocation();
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [reportData, setReportData] = useState<AgroReportData | null>(null);

    // ── Datos generales ──────────────────────────────────────
    const [fincas, setFincas] = useState<Finca[]>([]);
    const [fincaId, setFincaId] = useState<number | null>(location.state?.fincaId || null);
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
    const [filtroSeccion, setFiltroSeccion] = useState(location.state?.seccionNombre || "all");
    const [cuarentena, setCuarentena] = useState(false);
    const [modoReporte, setModoReporte] = useState(false);
    const [mostrarHeatmap, setMostrarHeatmap] = useState(false);
    const [seccionesStats, setSeccionesStats] = useState<SeccionStats[]>([]);

    // ── Wizard ───────────────────────────────────────────────
    const [paso, setPaso] = useState<Paso>("idle");
    const [puntosNuevos, setPuntosNuevos] = useState<{ lat: number; lng: number }[]>([]);
    const [arbolesPreview, setArbolesPreview] = useState<ArbolPreview[]>([]);
    const [progreso, setProgreso] = useState(0);

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
    const [seccionForm, setSeccionForm] = useState({ secc_nombre: "", secc_tipo_suelo: "" });
    const [guardandoSeccion, setGuardandoSeccion] = useState(false);



    // ─── Reset completo del wizard ───────────────────────────
    const resetWizard = () => {
        setPaso("idle");
        setPuntosNuevos([]);
        setArbolesPreview([]);
        setProgreso(0);
        setSeccionForm({ secc_nombre: "", secc_tipo_suelo: "" });
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
            setSeccionesStats(data.secciones_stats || []);
            return data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            setSeccionesStats(data.secciones_stats || []);
            if (!data.finca.fin_latitud_origen || !data.finca.fin_longitud_origen) {
                setCoordsForm({ lat: "14.6349", lng: "-90.5069" });
                setPaso("coords");
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

            // Seleccionar la primera sección que NO esté ocupada
            const seccionDisponible = secciones.find(s => Number(s.tiene_arboles || 0) === 0);
            if (seccionDisponible) {
                setSeccionSeleccionada(seccionDisponible.secc_seccion);
            } else if (secciones.length > 0) {
                setSeccionSeleccionada(null); // Ninguna disponible para selección
            }

            if (tipos.length > 0) setTipoArbolSeleccionado(tipos[0].tipar_tipo_arbol);

            // Si no tiene secciones, ir a crearla primero
            if (secciones.length === 0) setPaso("sin-seccion");
            else setPaso("configurar");

        } catch {
            toast.error("Error al cargar configuración. Intentá nuevamente.");
            setPaso("dibujando");
        } finally {
            setCargandoConfig(false);
        }
    };

    // ─── Confirmar configuración y generar grilla ────────────
    const confirmarConfiguracion = () => {
        if (!seccionSeleccionada || !tipoArbolSeleccionado) return;

        const preview = generarGrilla(
            puntosNuevos,
            espaciadoSeleccionado,
            finca?.fin_latitud_origen ?? 14.6349,
            finca?.fin_longitud_origen ?? -90.5069
        );
        if (preview.length === 0) {
            toast.error("El perímetro es muy pequeño para el espaciado configurado. Reducí el espaciado o dibujá un área más grande.");
            return;
        }
        setArbolesPreview(preview);
        setPaso("preview");
    };

    useEffect(() => {
        getFincas()
            .then((data: Finca[]) => {
                setFincas(data);
                if (data.length > 0 && !location.state?.fincaId) setFincaId(data[0].fin_finca);
            })
            .catch(() => setError("Error al cargar fincas"));
    }, [location.state?.fincaId]);

    useEffect(() => {
        if (fincaId) {
            setCentroManual(null); // Return to default finca center when switching
            if (fincaId !== location.state?.fincaId) {
                setFiltroSeccion("all");
            } else {
                setFiltroSeccion(location.state?.seccionNombre || "all");
            }
            cargarMapa(fincaId);
        }
    }, [fincaId, location.state?.fincaId, location.state?.seccionNombre, cargarMapa]);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            console.error("Error completo:", e);
            toast.error("Error al guardar las coordenadas: " + (e.response?.data?.message || e.message));
        } finally {
            setGuardandoCoords(false);
        }
    };

    // ─── Paso 2: Ir a configuración (sin guardar en BD aún) ──
    const irAConfigurar = async () => {
        if (!fincaId || puntosNuevos.length < 3) return;
        try {
            // Ya no guardamos el perímetro aquí para no sobreescribir el de la finca
            // Se guardará al final asociado a la sección elegida
            await cargarConfiguracion(fincaId);
        } catch {
            toast.error("Error al cargar la configuración.");
        }
    };

    // ─── Paso sin-seccion: crear sección y volver a config ───
    const crearSeccionYContinuar = async () => {
        if (!fincaId || !seccionForm.secc_nombre.trim()) return;
        setGuardandoSeccion(true);
        try {
            const { default: api } = await import("../../api/Axios");
            await api.post("/agro-seccion", {
                secc_nombre: seccionForm.secc_nombre.trim(),
                fin_finca: fincaId,
                secc_tipo_suelo: seccionForm.secc_tipo_suelo,
            });
            setSeccionForm({ secc_nombre: "", secc_tipo_suelo: "" });
            // Recargar configuración para que aparezca la sección recién creada
            await cargarConfiguracion(fincaId);
        } catch {
            toast.error("Error al crear la sección. Intentá nuevamente.");
        } finally {
            setGuardandoSeccion(false);
        }
    };

    // ─── Paso 4: confirmar y guardar en BD ───────────────────
    const confirmarGuardar = async () => {
        if (!fincaId || !seccionSeleccionada || arbolesPreview.length === 0) return;

        setPaso("guardando");
        setProgreso(0);

        try {
            const { default: api } = await import("../../api/Axios");

            // 0. Guardar el perímetro para esta sección
            await guardarPerimetro(fincaId, puntosNuevos, seccionSeleccionada);
            setProgreso(5);

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

            toast.success("✓ ¡Guardado exitoso!");
            setPaso("listo");

            setTimeout(async () => {
                const fid = fincaId;
                resetWizard();
                if (fid) await cargarDatosMapa(fid);
            }, 3000);

        } catch (err) {
            console.error(err);
            toast.error("Error al guardar: revisa los IDs de los surcos.");
            setPaso("preview");
        }
    };

    // ─── Eliminar Terreno (Sección + Árboles + Perímetro) ─────
    const eliminarTerrenoActual = async () => {
        const idSecc = arboles.find(a => a.seccion_nombre === filtroSeccion)?.seccion_id;
        if (!idSecc) {
            toast.info("Selecciona una sección específica para eliminar su terreno.");
            return;
        }

        toast.warning(`¿Estás seguro de eliminar el terreno "${filtroSeccion}"?`, {
            description: "Se borrarán todos sus árboles y el perímetro. Esta acción no se puede deshacer.",
            action: {
                label: "Eliminar definitivamente",
                onClick: async () => {
                    setLoading(true);
                    try {
                        const { default: api } = await import("../../api/Axios");
                        await api.delete(`/agro-seccion/${idSecc}`);
                        setFiltroSeccion("all");
                        if (fincaId) await cargarDatosMapa(fincaId);
                        toast.success("Terreno eliminado exitosamente.");
                    } catch (err) {
                        console.error(err);
                        toast.error("Error al eliminar el terreno.");
                    } finally {
                        setLoading(false);
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => { } },
            duration: 8000
        });
    };

    // ─── Exportación PDF ──────────────────────────────────────
    const exportarPDF = async () => {
        if (!finca || isExporting) return;
        setIsExporting(true);
        toast.info("Generando reporte fitosanitario...", { duration: 2000 });

        try {
            // ── 1. Captura del mapa Leaflet ───────────────────────────────────────
            const mapContainer = document.querySelector(".leaflet-container") as HTMLElement;
            if (!mapContainer) throw new Error("Mapa no encontrado");

            const mapCanvas = await html2canvas(mapContainer, {
                useCORS: true,
                logging: false,
                scale: 1,
            });
            const snapshot = mapCanvas.toDataURL("image/png");

            // ── 2. Alertas + análisis de laboratorio (gráficos) ──────────────────
            let alertasSalud: Array<{
                alertsalud_id: number;
                arb_arbol: number;
                descripcion_sintoma?: string;
            }> = [];
            let analisisLab: Array<{
                alert_alerta_salud: number;
                analab_fecha_resultado?: string | null;
            }> = [];

            try {
                const { default: api } = await import("../../api/Axios");
                const [resAlertas, resAnalisis] = await Promise.all([
                    api.get("/agro-alerta-salud"),
                    api.get("/agro-analisis-laboratorio"),
                ]);
                alertasSalud = Array.isArray(resAlertas.data)
                    ? resAlertas.data
                    : (resAlertas.data.alertas ?? []);
                analisisLab = Array.isArray(resAnalisis.data)
                    ? resAnalisis.data
                    : (resAnalisis.data.analisis ?? resAnalisis.data ?? []);
            } catch {
                alertasSalud = [];
                analisisLab  = [];
            }

            const idsDictaminadas = new Set(
                analisisLab
                    .filter(a => a.analab_fecha_resultado)
                    .map(a => Number(a.alert_alerta_salud))
            );

            const idsArbolesEnFinca = new Set(arboles.map(a => a.id));
            const alertasFinca = alertasSalud.filter(al => idsArbolesEnFinca.has(al.arb_arbol));
            const alertasDictaminadasFinca = alertasFinca.filter(al => idsDictaminadas.has(al.alertsalud_id));

            const conteoAlertasPorArbol = alertasFinca.reduce<Record<number, number>>(
                (acc, al) => { acc[al.arb_arbol] = (acc[al.arb_arbol] ?? 0) + 1; return acc; },
                {}
            );
            const top10Arboles = Object.entries(conteoAlertasPorArbol)
                .sort(([, a], [, b]) => b - a).slice(0, 10)
                .map(([idStr, totalAlertas]) => {
                    const id = Number(idStr);
                    const arb = arboles.find(a => a.id === id);
                    return { arbol_id: id, referencia: arb?.referencia ?? `#${id}`, seccion: arb?.seccion_nombre ?? "—", surco: arb?.numero_surco ?? 0, totalAlertas, estado: arb?.estado ?? "—" };
                });

            const conteoSintomas = alertasDictaminadasFinca.reduce<Record<string, number>>(
                (acc, al) => { const s = (al.descripcion_sintoma ?? "").trim().slice(0, 40) || "Sin descripción"; acc[s] = (acc[s] ?? 0) + 1; return acc; },
                {}
            );
            const frecuenciaEnfermedades = Object.entries(conteoSintomas)
                .sort(([, a], [, b]) => b - a).slice(0, 8)
                .map(([nombre, cantidad]) => ({ nombre, cantidad }));

            const charts: ChartsData = { top10Arboles, frecuenciaEnfermedades };

            // ── 3. Datos climáticos (módulo predictivo) ───────────────────────────
            const climaRes = await getAgroClimas();
            const climaRaw: unknown[] = climaRes.data?.climas ?? climaRes.data ?? [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const alertas_clima: ClimaticData[] = (climaRaw as any[]).map((c: any) => ({
                humedad:       Number(c.clim_humedad_relativa ?? c.clim_humedad ?? c.humedad ?? 0),
                temperatura:   Number(c.clim_temperatura ?? c.temperatura ?? 0),
                precipitacion: Number(c.clim_precipitacion ?? c.precipitacion ?? 0),
                fecha:         c.clim_fecha ?? c.fecha ?? "",
                seccion_id:    Number(c.secc_seccion ?? c.seccion_id ?? 0),
                seccion_nombre: c.secc_nombre ?? c.seccion_nombre,
            }));

            const correlacionesMap = new Map<string, { condicion: string; riesgo: string; descripcion: string }>();
            for (const c of alertas_clima) {
                if (c.humedad > 80)       correlacionesMap.set("humedad-critica",  { condicion: "Humedad crítica",  riesgo: "alto",  descripcion: "Alta probabilidad de Roya en 3 días" });
                else if (c.humedad >= 70) correlacionesMap.set("humedad-elevada",  { condicion: "Humedad elevada",  riesgo: "medio", descripcion: "Monitorear árboles en sección afectada" });
                if (c.temperatura > 30)   correlacionesMap.set("temperatura-alta", { condicion: "Temperatura alta", riesgo: "medio", descripcion: "Condiciones favorables para plagas" });
                if (c.precipitacion > 10) correlacionesMap.set("lluvia-intensa",   { condicion: "Lluvia intensa",   riesgo: "alto",  descripcion: "Riesgo de hongos y pudrición radicular" });
            }

            // ── 4. Objeto completo del reporte ────────────────────────────────────
            const nuevoReportData: AgroReportData = {
                finca: {
                    id: finca.fin_finca,
                    nombre: finca.fin_nombre,
                    ubicacion: finca.fin_ubicacion,
                },
                fecha: new Date().toLocaleDateString("es-GT"),
                autor: "Administrador AgroTech",

                mapa: {
                    snapshot,
                    stats: renderPoligonos.map(p => ({
                        seccion_id: p.seccionId,
                        nombre: p.nombre,
                        total: p.stats?.total ?? 0,
                        enfermos: p.stats?.enfermos ?? 0,
                        incidencia: p.incidencia,
                    })),
                    modo: mostrarHeatmap ? "Heatmap" : "Choropleth",
                },

                estadisticas: {
                    totalArboles: arboles.length,
                    totalSurcos: [...new Set(arboles.map(a => a.numero_surco))].length,
                    totalSecciones: [...new Set(arboles.map(a => a.seccion_id))].length,
                    arbolesEnfermos: arboles.filter(a => a.estado === "Enfermo").length,
                    arbolesEnAlerta: arboles.filter(a => a.estado_sospechoso).length,
                    distribucionEstados: [
                        { estado: "Crecimiento", cantidad: arboles.filter(a => a.estado === "Crecimiento").length },
                        { estado: "Produccion",  cantidad: arboles.filter(a => a.estado === "Produccion").length },
                        { estado: "Enfermo",     cantidad: arboles.filter(a => a.estado === "Enfermo").length },
                        { estado: "Muerto",      cantidad: arboles.filter(a => a.estado === "Muerto").length },
                    ],
                    surcosCriticos: seccionesStats
                        .map(s => ({
                            nombre: s.nombre,
                            total: s.total,
                            enfermos: s.enfermos,
                            alertas: arboles.filter(a => a.seccion_id === s.seccion_id && a.estado_sospechoso).length,
                        }))
                        .filter(s => s.enfermos > 0 || s.alertas > 0)
                        .sort((a, b) => (b.enfermos + b.alertas) - (a.enfermos + a.alertas))
                        .slice(0, 5),
                    arbolesSOspechosos: arboles
                        .filter(a => a.estado_sospechoso)
                        .map(a => {
                            const siembra = new Date(a.fecha_siembra);
                            const aniosTranscurridos = (Date.now() - siembra.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                            const aniosEsperados = a.anios_produccion ?? 8;
                            return {
                                arbol_id: a.id,
                                referencia: a.referencia,
                                seccion: a.seccion_nombre,
                                surco: a.numero_surco,
                                variedad: a.variedad,
                                fecha_siembra: a.fecha_siembra,
                                anios_transcurridos: Math.round(aniosTranscurridos * 10) / 10,
                                anios_esperados: aniosEsperados,
                                exceso_anios: Math.round((aniosTranscurridos - aniosEsperados) * 10) / 10,
                            };
                        })
                        .sort((a, b) => b.exceso_anios - a.exceso_anios)
                        .slice(0, 20),
                },

                charts,

                prediccion: {
                    alertas_clima,
                    correlaciones: Array.from(correlacionesMap.values()),
                },
            };

            setReportData(nuevoReportData);

            // ── 8. Renderizar template y generar PDF ──────────────────────────────
            //       600 ms = suficiente para que React hidrate el template oculto
            setTimeout(async () => {
                if (reportRef.current) {
                    const ok = await generatePDF(
                        reportRef.current,
                        `Reporte_Fitosanitario_${finca.fin_nombre.replace(/\s+/g, "_")}`,
                    );
                    if (ok) toast.success("✓ Reporte generado con éxito");
                    else toast.error("Error al generar el PDF");
                    setIsExporting(false);
                }
            }, 600);

        } catch (err) {
            console.error(err);
            toast.error("Error al capturar el mapa para el reporte");
            setIsExporting(false);
        }
    };

    // ─── Datos derivados ──────────────────────────────────────
    const seccionesUnicas = [...new Set(arboles.map(a => a.seccion_nombre))];
    const arbolesEnfermosBD = arboles.filter(a => a.estado === "Enfermo");

    // Lógica de Cuarentena Dinámica: todo árbol a <= 10m de un enfermo es Cuarentena (si está activado)
    const arbolesConEstadoEfectivo = arboles.map(a => {
        if (a.estado === "Enfermo") return a;
        if (cuarentena) {
            const estaEnCuarentena = arbolesEnfermosBD.some(enfermo =>
                L.latLng(a.lat, a.lng).distanceTo(L.latLng(enfermo.lat, enfermo.lng)) <= 10
            );
            if (estaEnCuarentena) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return { ...a, estado: "Cuarentena" as any };
            }
        }
        return a;
    });

    const arbolesFiltrados = arbolesConEstadoEfectivo.filter(a =>
        (filtroEstado === "all" || a.estado === filtroEstado) &&
        (filtroSeccion === "all" || a.seccion_nombre === filtroSeccion)
    );
    const arbolesEnfermos = arbolesFiltrados.filter(a => a.estado === "Enfermo");

    // ─── Utilidades Reporte ──────────────────────────────────
    const getIncidenciaColor = (inc: number) => {
        if (inc === 0) return "#4a7c59";
        if (inc <= 5) return "#27ae60";
        if (inc <= 15) return "#f1c40f";
        if (inc <= 30) return "#e67e22";
        return "#c0392b";
    };

    const puntosHeatmap = useMemo(() => {
        return arbolesEnfermos.map(a => [a.lat, a.lng, 1] as [number, number, number]);
    }, [arbolesEnfermos]);

    // Agrupar perímetros por sección
    const poligonosPorSeccion = perimetro.reduce((acc, p) => {
        const sid = p.seccion_id || 0;
        if (!acc[sid]) acc[sid] = [];
        acc[sid].push(p);
        return acc;
    }, {} as Record<number, PuntoPerimetro[]>);

    // Convertir a formato Leaflet, sorteando por orden
    const renderPoligonos = Object.entries(poligonosPorSeccion).map(([sid, puntos]) => {
        const idS = Number(sid);
        // Búsqueda robusta por ID numérico
        const stats = seccionesStats.find(s => Number(s.seccion_id) === idS);

        return {
            seccionId: idS,
            nombre: arboles.find(a => a.seccion_id === idS)?.seccion_nombre || stats?.nombre || "Sección",
            puntos: puntos.sort((a, b) => a.orden - b.orden).map(p => [p.lat, p.lng] as [number, number]),
            incidencia: stats ? Number(stats.incidencia) : 0,
            stats: stats || { total: 0, enfermos: 0, incidencia: 0 }
        };
    }).filter(p => p.puntos.length >= 3);

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
        cuarentena: arbolesFiltrados.filter(a => a.estado === "Cuarentena").length,
    };

    const estaEnWizard = paso !== "idle" && paso !== "listo";

    const perimetroTotal = useMemo(() => {
        if (puntosNuevos.length < 2) return 0;
        let sum = 0;
        for (let i = 0; i < puntosNuevos.length - 1; i++) {
            sum += L.latLng(puntosNuevos[i]).distanceTo(L.latLng(puntosNuevos[i + 1]));
        }
        if (puntosNuevos.length > 2) {
            sum += L.latLng(puntosNuevos[puntosNuevos.length - 1]).distanceTo(L.latLng(puntosNuevos[0]));
        }
        return sum;
    }, [puntosNuevos]);



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

                    <button onClick={() => setModoReporte(v => !v)} style={{
                        ...btnOutline,
                        background: modoReporte ? "#7c3aed" : "transparent",
                        color: modoReporte ? "#fff" : "#7c3aed", borderColor: "#7c3aed",
                        fontWeight: "bold"
                    }}>
                        {modoReporte ? "📊 Ver Mapa Normal" : "🩺 Modo Reporte Salud"}
                    </button>

                    <button onClick={() => setMostrarHeatmap(v => !v)} style={{
                        ...btnOutline,
                        background: mostrarHeatmap ? "#f97316" : "transparent",
                        color: mostrarHeatmap ? "#fff" : "#f97316", borderColor: "#f97316",
                        fontWeight: "bold"
                    }}>
                        <Flame size={14} style={{ display: "inline", marginRight: 4 }} />
                        {mostrarHeatmap ? "Ocultar Heatmap" : "Ver Heatmap de Focos"}
                    </button>

                    <button
                        onClick={exportarPDF}
                        disabled={isExporting || !finca}
                        style={{
                            ...btnOutline,
                            background: "#2d4a2d",
                            color: "#fff", borderColor: "#2d4a2d",
                            fontWeight: "bold", opacity: isExporting ? 0.7 : 1
                        }}
                    >
                        <FileText size={14} style={{ display: "inline", marginRight: 4 }} />
                        {isExporting ? "Generando..." : "Exportar PDF"}
                    </button>

                    {filtroSeccion !== "all" && paso === "idle" && (
                        <button onClick={eliminarTerrenoActual} style={{ ...btnOutline, color: "#c0392b", borderColor: "#c0392b", fontWeight: "bold" }}>
                            🗑️ Eliminar Terreno
                        </button>
                    )}

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
                    
                    {finca && paso === "idle" && (
                        <button 
                            onClick={exportarPDF} 
                            disabled={isExporting}
                            style={{ ...btnPrimary, background: "#4a7c59", display: "flex", alignItems: "center", gap: 6 }}>
                            <FileText size={16} />
                            {isExporting ? "Exportando..." : "Exportar PDF"}
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
                    descripcion="Hacé click en el mapa inferior para ubicar el origen, o ingresá las coordenadas de la esquina noroeste (NW) del terreno manualmente.">
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
                        {perimetroTotal > 0 && (
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#185FA5", background: "#f0f7ff", padding: "4px 12px", borderRadius: 8 }}>
                                📏 Perímetro: {perimetroTotal < 1000 ? `${perimetroTotal.toFixed(1)}m` : `${(perimetroTotal / 1000).toFixed(2)}km`}
                            </span>
                        )}
                        <button onClick={() => setPuntosNuevos(p => p.slice(0, -1))}
                            disabled={puntosNuevos.length === 0}
                            style={{ ...btnSecondary, opacity: puntosNuevos.length === 0 ? 0.4 : 1 }}>
                            ← Deshacer
                        </button>
                        <button onClick={() => setPuntosNuevos([])} style={btnDanger}>Limpiar</button>
                        <button onClick={irAConfigurar}
                            disabled={puntosNuevos.length < 3 || cargandoConfig}
                            style={{ ...btnPrimary, marginLeft: "auto", opacity: puntosNuevos.length < 3 ? 0.5 : 1 }}>
                            {cargandoConfig ? "Cargando..." : "Continuar →"}
                        </button>
                    </div>
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
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <select
                                        value={seccionSeleccionada ?? ""}
                                        onChange={e => setSeccionSeleccionada(Number(e.target.value))}
                                        style={{ ...inputStyle, flex: 1, cursor: "pointer" }}>
                                        {seccionesFinca.map(s => (
                                            <option
                                                key={s.secc_seccion}
                                                value={s.secc_seccion}
                                                disabled={Number(s.tiene_arboles || 0) > 0}
                                                style={{ color: Number(s.tiene_arboles || 0) > 0 ? "#9ca3af" : "inherit" }}
                                            >
                                                {s.secc_nombre} {Number(s.tiene_arboles || 0) > 0 ? "(Ya utilizada)" : `— ${s.secc_tipo_suelo}`}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setPaso("sin-seccion")}
                                        title="Nueva sección"
                                        style={{
                                            background: "#7c3aed", color: "#fff", border: "none",
                                            borderRadius: 8, width: 36, height: 36, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            boxShadow: "0 2px 4px rgba(124, 58, 237, 0.2)",
                                            flexShrink: 0
                                        }}>
                                        <Plus size={18} />
                                    </button>
                                </div>
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
                        <button onClick={() => { setPaso("dibujando"); }} style={btnSecondary}>
                            ← Redibujar
                        </button>
                        <button
                            onClick={confirmarConfiguracion}
                            disabled={!seccionSeleccionada || !tipoArbolSeleccionado}
                            style={{ ...btnPrimary, opacity: (!seccionSeleccionada || !tipoArbolSeleccionado) ? 0.5 : 1 }}>
                            Generar árboles →
                        </button>
                    </div>
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
                            <label style={labelStyle}>Tipo de suelo</label>
                            <input
                                type="text"
                                value={seccionForm.secc_tipo_suelo}
                                onChange={e => setSeccionForm({ ...seccionForm, secc_tipo_suelo: e.target.value })}
                                placeholder='Ej: "Franco Arcilloso"'
                                style={{ ...inputStyle, width: "100%" }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setPaso("dibujando"); }} style={btnSecondary}>
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
                </WizardPanel>
            )}

            {/* PASO 4 — Preview */}
            {paso === "preview" && arbolesPreview.length > 0 && (
                <WizardPanel paso={4} totalPasos={4} color="#4a7c59"
                    titulo="Paso 4 — Confirmá los árboles generados">
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {[
                                { icon: <Leaf size={22} color="#2d4a2d" strokeWidth={2} />, label: "Árboles", val: arbolesPreview.length.toLocaleString() },
                                { icon: <Layers size={22} color="#b45309" strokeWidth={2} />, label: "Surcos", val: String(new Set(arbolesPreview.map(a => a.surco)).size) },
                                { icon: <Ruler size={22} color="#185FA5" strokeWidth={2} />, label: "Perímetro", val: perimetroTotal < 1000 ? `${perimetroTotal.toFixed(1)}m` : `${(perimetroTotal / 1000).toFixed(2)}km` },
                                { icon: <Expand size={22} color="#4a7c59" strokeWidth={2} />, label: "Espaciado", val: `${espaciadoSeleccionado}m` },
                                {
                                    icon: <FolderTree size={22} color="#7a5a00" strokeWidth={2} />, label: "Sección",
                                    val: seccionesFinca.find(s => s.secc_seccion === seccionSeleccionada)?.secc_nombre ?? "—"
                                },
                                {
                                    icon: <TreePine size={22} color="#2d6a2d" strokeWidth={2} />, label: "Tipo",
                                    val: tiposArbol.find(t => t.tipar_tipo_arbol === tipoArbolSeleccionado)?.tipar_nombre_comun ?? "—"
                                },
                            ].map(item => (
                                <div key={item.label} style={{
                                    background: "#f0f7f0", borderRadius: 10,
                                    padding: "10px 14px", textAlign: "center", minWidth: 70,
                                    display: "flex", flexDirection: "column", alignItems: "center"
                                }}>
                                    <div style={{ marginBottom: 4 }}>{item.icon}</div>
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
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2d6a2d" }}>Configuración completada correctamente.</p>
                </WizardPanel>
            )}

            {/* ── STATS ── */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                {[
                    { label: "Total", val: stats.total, color: "#2d4a2d" },
                    { label: "Producción", val: stats.produccion, color: "#185FA5" },
                    { label: "Enfermos", val: stats.enfermos, color: "#c0392b" },
                    { label: "Crecimiento", val: stats.crecimiento, color: "#4a7c59" },
                    ...(cuarentena ? [{ label: "Cuarentena", val: stats.cuarentena, color: "#c0392b" }] : []),
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
                    maxZoom={24} style={{ height: "100%", width: "100%" }} scrollWheelZoom preferCanvas={true}>
                    <MapUpdater lat={centroActivo[0]} lng={centroActivo[1]} />
                    <LocationMarker onPos={setGpsPosition} />
                    <ControlMapa
                        activo={paso === "dibujando"}
                        onPunto={ll => setPuntosNuevos(prev => [...prev, { lat: ll.lat, lng: ll.lng }])}
                    />
                    <ControlOrigen
                        activo={paso === "coords"}
                        onPunto={ll => setCoordsForm({ lat: String(ll.lat), lng: String(ll.lng) })}
                    />
                    {mostrarHeatmap && <HeatmapLayer points={puntosHeatmap} />}
                    {paso === "coords" && coordsForm.lat && coordsForm.lng && !isNaN(Number(coordsForm.lat)) && !isNaN(Number(coordsForm.lng)) && (
                        <Marker position={[Number(coordsForm.lat), Number(coordsForm.lng)]}>
                            <Tooltip permanent direction="top" offset={[0, -32]}>
                                <span style={{ fontWeight: "bold", color: "#b45309" }}>Punto de Origen</span>
                            </Tooltip>
                        </Marker>
                    )}
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

                    {renderPoligonos.map(poly => (
                        <Polygon key={`poly-${poly.seccionId}`} positions={poly.puntos}
                            pathOptions={{
                                color: modoReporte ? getIncidenciaColor(poly.incidencia) : (filtroSeccion === "all" || filtroSeccion === poly.nombre ? "#4a7c59" : "#ccc"),
                                fillColor: modoReporte ? getIncidenciaColor(poly.incidencia) : (filtroSeccion === "all" || filtroSeccion === poly.nombre ? "#4a7c59" : "#ccc"),
                                fillOpacity: modoReporte ? 0.4 : ((filtroSeccion === poly.nombre) ? 0.2 : 0.05),
                                weight: (filtroSeccion === poly.nombre || modoReporte) ? 3 : 1.5,
                                dashArray: (filtroSeccion === poly.nombre) ? "0" : "6 4"
                            }}>
                            <Tooltip sticky>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{ fontWeight: "bold" }}>{poly.nombre}</div>
                                    {modoReporte && (
                                        <div style={{ fontSize: 11, color: getIncidenciaColor(poly.incidencia) }}>
                                            Incidencia: {poly.incidencia}%
                                            <br />
                                            ({poly.stats?.enfermos} de {poly.stats?.total} árboles)
                                        </div>
                                    )}
                                </div>
                            </Tooltip>
                            <MedidasPoligono puntos={poly.puntos.map(p => ({ lat: p[0], lng: p[1] }))} color={modoReporte ? getIncidenciaColor(poly.incidencia) : "#4a7c59"} />
                        </Polygon>
                    ))}
                    {paso === "dibujando" && poligonoEnDibujo.length >= 2 && (
                        <>
                            <Polygon positions={poligonoEnDibujo}
                                pathOptions={{ color: "#185FA5", fillColor: "#185FA5", fillOpacity: 0.10, weight: 2, dashArray: "4 3" }} />
                            <MedidasPoligono puntos={puntosNuevos} color="#185FA5" />
                        </>
                    )}
                    {paso === "dibujando" && puntosNuevos.map((p, i) => (
                        <Marker
                            key={`np-${i}`}
                            position={[p.lat, p.lng]}
                            draggable={true}
                            icon={vertexIcon(i)}
                            eventHandlers={{
                                drag: (e) => {
                                    const { lat, lng } = e.target.getLatLng();
                                    setPuntosNuevos(prev => {
                                        const copy = [...prev];
                                        copy[i] = { lat, lng };
                                        return copy;
                                    });
                                }
                            }}
                        />
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
                                    <button onClick={() => navigate(`/agro-alerta-salud?nuevoArbol=${arbol.id}`)} style={popupBtnStyle}>+ Nueva alerta</button>
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

                {modoReporte && (
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginLeft: "auto", background: "#f8fafc", padding: "6px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                        <span style={{ fontWeight: 700, fontSize: 11, color: "#64748b", marginRight: 4 }}>NIVEL DE INCIDENCIA:</span>
                        {[
                            { label: "Sano (0%)", color: "#4a7c59" },
                            { label: "Bajo (1-5%)", color: "#27ae60" },
                            { label: "Medio (5-15%)", color: "#f1c40f" },
                            { label: "Alto (15-30%)", color: "#e67e22" },
                            { label: "Crítico (>30%)", color: "#c0392b" },
                        ].map(level => (
                            <span key={level.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ width: 12, height: 12, borderRadius: 3, background: level.color }} />
                                {level.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* ── TEMPLATE OCULTO PARA PDF ── */}
            <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
                {reportData && (
                    <AgroReportTemplate
                        ref={reportRef}
                        data={reportData}
                    />
                )}
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