// ============================================================
// ArbolTimelinePage.tsx
// Vista "Timeline del Árbol" — línea de tiempo vertical con
// todos los eventos de un árbol seleccionado.
// ============================================================

import { History, Sprout, RefreshCw, AlertTriangle, FlaskConical, TreePine } from "lucide-react";
import { useArbolTimeline } from "./useArbolTimeline";
import type { TipoEvento } from "./useArbolTimeline";

// ── Config visual por tipo de evento ─────────────────────────

const EVENTO_CONFIG: Record<TipoEvento, {
    icono:    React.ElementType;
    color:    string;   // color del ícono
    bg:       string;   // fondo del círculo
    ring:     string;   // borde de la línea
    cardBg:   string;
    label:    string;
}> = {
    siembra: {
        icono:  Sprout,
        color:  "#166534",
        bg:     "bg-[#dcfce7]",
        ring:   "bg-[#4ade80]",
        cardBg: "bg-[#f0fdf4]",
        label:  "Siembra",
    },
    estado: {
        icono:  RefreshCw,
        color:  "#1e40af",
        bg:     "bg-[#dbeafe]",
        ring:   "bg-[#60a5fa]",
        cardBg: "bg-[#eff6ff]",
        label:  "Estado",
    },
    alerta: {
        icono:  AlertTriangle,
        color:  "#9a3412",
        bg:     "bg-[#fde8e0]",
        ring:   "bg-[#fb923c]",
        cardBg: "bg-[#fff7ed]",
        label:  "Alerta",
    },
    analisis: {
        icono:  FlaskConical,
        color:  "#6b21a8",
        bg:     "bg-[#f3e8ff]",
        ring:   "bg-[#c084fc]",
        cardBg: "bg-[#faf5ff]",
        label:  "Análisis",
    },
};

const LABEL_CLS = "text-[11px] font-bold text-[#6b8c6b] uppercase tracking-wider";
const INPUT_CLS = "w-full mt-1.5 px-3 py-2.5 text-sm border-[1.5px] border-[#c8d8c0] rounded-lg bg-[#f9f6f0] text-[#2d4a2d] outline-none focus:border-[#4a7c59] transition-colors";

// ── Componente ────────────────────────────────────────────────

const ArbolTimelinePage = () => {
    const {
        arbolId,
        setArbolId,
        arbolSeleccionado,
        opcionesArboles,
        eventos,
        loadingInit,
        loadingData,
        error,
    } = useArbolTimeline();

    return (
        <div className="p-8">
            <div className="max-w-[760px] mx-auto">

                {/* ── Encabezado ─────────────────────────────── */}
                <div className="flex items-center gap-3.5 mb-7">
                    <div className="bg-[#4a7c59] rounded-[14px] w-12 h-12 flex items-center justify-center shadow-[0_2px_8px_rgba(74,124,89,0.25)]">
                        <History size={24} color="#fff" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#2d4a2d] m-0">Timeline del Árbol</h1>
                        <p className="text-[13px] text-[#7a9a7a] mt-0.5">
                            Línea de tiempo completa de siembra, estados, alertas y análisis
                        </p>
                    </div>
                </div>

                {/* ── Selector de árbol ──────────────────────── */}
                <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(74,124,89,0.08)] p-6 mb-6">
                    <label className={LABEL_CLS}>Seleccionar árbol</label>
                    {loadingInit ? (
                        <p className="text-sm text-[#7a9a7a] mt-2">Cargando árboles...</p>
                    ) : (
                        <select
                            value={arbolId}
                            onChange={e => setArbolId(e.target.value)}
                            className={INPUT_CLS}
                        >
                            <option value="">— Selecciona un árbol —</option>
                            {opcionesArboles.map(op => (
                                <option key={op.valor} value={op.valor}>{op.label}</option>
                            ))}
                        </select>
                    )}

                    {/* Info rápida del árbol seleccionado */}
                    {arbolSeleccionado && (
                        <div className="mt-4 flex gap-6 text-sm">
                            <div>
                                <span className={LABEL_CLS}>ID</span>
                                <p className="text-[#2d4a2d] font-semibold mt-0.5">#{arbolSeleccionado.arb_arbol}</p>
                            </div>
                            <div>
                                <span className={LABEL_CLS}>Estado actual</span>
                                <p className="text-[#2d4a2d] font-semibold mt-0.5">{arbolSeleccionado.arb_estado ?? "—"}</p>
                            </div>
                            <div>
                                <span className={LABEL_CLS}>Surco</span>
                                <p className="text-[#2d4a2d] font-semibold mt-0.5">#{arbolSeleccionado.sur_surcos}</p>
                            </div>
                            <div>
                                <span className={LABEL_CLS}>Posición</span>
                                <p className="text-[#2d4a2d] font-semibold mt-0.5">{arbolSeleccionado.arb_posicion_surco ?? "—"}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Error ──────────────────────────────────── */}
                {error && (
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                )}

                {/* ── Estado vacío ────────────────────────────── */}
                {!arbolId && !loadingInit && (
                    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(74,124,89,0.08)] flex flex-col items-center justify-center py-16 text-center">
                        <TreePine size={40} color="#c8d8c0" />
                        <p className="text-[#aaa] text-sm mt-3">
                            Selecciona un árbol para ver su historial
                        </p>
                    </div>
                )}

                {/* ── Cargando datos ───────────────────────────── */}
                {loadingData && (
                    <div className="flex items-center justify-center py-16">
                        <p className="text-[#5a7a5a]">Cargando timeline...</p>
                    </div>
                )}

                {/* ── Timeline ────────────────────────────────── */}
                {!loadingData && arbolId && eventos.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(74,124,89,0.08)] flex flex-col items-center justify-center py-16 text-center">
                        <History size={36} color="#c8d8c0" />
                        <p className="text-[#aaa] text-sm mt-3">No hay eventos registrados para este árbol</p>
                    </div>
                )}

                {!loadingData && eventos.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(74,124,89,0.08)] px-8 py-6">

                        {/* Leyenda */}
                        <div className="flex gap-4 flex-wrap mb-6 pb-5 border-b border-[#f0ece4]">
                            {(Object.entries(EVENTO_CONFIG) as [TipoEvento, typeof EVENTO_CONFIG[TipoEvento]][]).map(([tipo, cfg]) => {
                                const Icono = cfg.icono;
                                return (
                                    <div key={tipo} className="flex items-center gap-1.5">
                                        <div className={`${cfg.bg} w-6 h-6 rounded-full flex items-center justify-center`}>
                                            <Icono size={12} color={cfg.color} />
                                        </div>
                                        <span className="text-[12px] text-[#6b8c6b]">{cfg.label}</span>
                                    </div>
                                );
                            })}
                            <span className="ml-auto text-[12px] text-[#aaa]">{eventos.length} eventos</span>
                        </div>

                        {/* Eventos */}
                        <ol className="relative">
                            {eventos.map((evento, i) => {
                                const cfg  = EVENTO_CONFIG[evento.tipo];
                                const Icono = cfg.icono;
                                const esUltimo = i === eventos.length - 1;

                                return (
                                    <li key={evento.id} className="flex gap-5 relative">

                                        {/* Columna izquierda: círculo + línea vertical */}
                                        <div className="flex flex-col items-center">
                                            <div className={`${cfg.bg} w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm`}>
                                                <Icono size={16} color={cfg.color} />
                                            </div>
                                            {!esUltimo && (
                                                <div className="w-[2px] flex-1 bg-[#e8f0e0] my-1" />
                                            )}
                                        </div>

                                        {/* Tarjeta del evento */}
                                        <div className={`${cfg.cardBg} border border-[#e8f0e0] rounded-xl px-4 py-3 mb-4 flex-1`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-sm font-semibold text-[#2d4a2d] m-0 leading-snug">
                                                    {evento.titulo}
                                                </p>
                                                <span className="text-[11px] text-[#8aaa8a] shrink-0 font-mono mt-0.5">
                                                    {evento.fecha
                                                        ? new Date(evento.fecha + (evento.fecha.includes("T") ? "" : "T00:00:00"))
                                                            .toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
                                                        : "—"
                                                    }
                                                </span>
                                            </div>
                                            {evento.detalle && (
                                                <p className="text-[12px] text-[#6b8c6b] mt-1 m-0">{evento.detalle}</p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ArbolTimelinePage;
