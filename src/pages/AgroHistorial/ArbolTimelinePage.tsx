// ============================================================
// ArbolTimelinePage.tsx
// Vista "Timeline del Árbol" — línea de tiempo vertical con
// todos los eventos de un árbol seleccionado.
// ============================================================

import React, { useRef, useState, useEffect } from "react";
import { History, Sprout, RefreshCw, AlertTriangle, FlaskConical, TreePine, ChevronDown, Search } from "lucide-react";
import { useArbolTimeline } from "./useArbolTimeline";
import type { TipoEvento } from "./useArbolTimeline";
import { calcularEdad } from "../AgroArbol/useAgroArbol";

// ── Config visual por tipo de evento ─────────────────────────

const EVENTO_CONFIG: Record<TipoEvento, {
    icono: React.ElementType;
    color: string;   // color del ícono
    bg: string;   // fondo del círculo
    ring: string;   // borde de la línea
    cardBg: string;
    label: string;
}> = {
    siembra: {
        icono: Sprout,
        color: "#166534",
        bg: "bg-[#dcfce7]",
        ring: "bg-[#4ade80]",
        cardBg: "bg-[#f0fdf4]",
        label: "Siembra",
    },
    estado: {
        icono: RefreshCw,
        color: "#1e40af",
        bg: "bg-[#dbeafe]",
        ring: "bg-[#60a5fa]",
        cardBg: "bg-[#eff6ff]",
        label: "Estado",
    },
    alerta: {
        icono: AlertTriangle,
        color: "#9a3412",
        bg: "bg-[#fde8e0]",
        ring: "bg-[#fb923c]",
        cardBg: "bg-[#fff7ed]",
        label: "Alerta",
    },
    analisis: {
        icono: FlaskConical,
        color: "#6b21a8",
        bg: "bg-[#f3e8ff]",
        ring: "bg-[#c084fc]",
        cardBg: "bg-[#faf5ff]",
        label: "Análisis",
    },
};

const LABEL_CLS = "text-[11px] font-bold text-[#6b8c6b] uppercase tracking-wider";
const INPUT_CLS = "w-full mt-1.5 px-3 py-2.5 text-sm border-[1.5px] border-[#c8d8c0] rounded-lg bg-[#f9f6f0] text-[#2d4a2d] outline-none focus:border-[#4a7c59] transition-colors";

const getColorEstado = (estadoRaw: string) => {
    const estado = estadoRaw.trim().toLowerCase();
    if (estado.includes("producci")) return { bg: "bg-[#dcfce7]", text: "text-[#166534]", border: "border-[#bbf7d0]", ring: "ring-[#22c55e]" }; // Verde
    if (estado.includes("crecimient")) return { bg: "bg-[#dbeafe]", text: "text-[#1e40af]", border: "border-[#bfdbfe]", ring: "ring-[#3b82f6]" }; // Azul
    if (estado.includes("enfermo")) return { bg: "bg-[#fef9c3]", text: "text-[#854d0e]", border: "border-[#fef08a]", ring: "ring-[#eab308]" }; // Amarillo
    return { bg: "bg-[#f3f4f6]", text: "text-[#4b5563]", border: "border-[#e5e7eb]", ring: "ring-[#d1d5db]" };
};

// ── Componente Selector Custom ────────────────────────────────
const TreeSelect = ({ arbolId, setArbolId, opcionesArboles }: { arbolId: string, setArbolId: (id: string) => void, opcionesArboles: any[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = opcionesArboles.find((op) => op.valor === arbolId);
    
    const filteredOptions = opcionesArboles.filter((op) => 
        op.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getEstado = (label: string) => {
        const parts = label.split("—");
        return parts.length > 1 ? parts[1].trim() : "";
    };

    const getNombre = (label: string) => {
        const parts = label.split("—");
        return parts[0].trim();
    };

    const selectedColor = selectedOption ? getColorEstado(getEstado(selectedOption.label)) : null;

    return (
        <div className="relative w-full mt-2" ref={wrapperRef}>
            {/* Input simulado (botón principal coloreado) */}
            <div 
                className={`flex items-center justify-between w-full px-4 py-3 border-[2px] rounded-xl cursor-pointer transition-all duration-200
                    ${selectedColor ? `${selectedColor.bg} ${selectedColor.border}` : "bg-[#fdfdfc] border-[#e8f0e0] hover:border-[#c8d8c0]"}
                    ${isOpen && selectedColor ? `ring-4 ${selectedColor.ring}/20` : isOpen ? "ring-4 ring-[#4a7c59]/10 border-[#4a7c59]" : ""}
                `}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <TreePine size={18} className={`shrink-0 ${selectedColor ? selectedColor.text : "text-[#4a7c59]"}`} />
                    {selectedOption ? (
                        <div className="flex items-center gap-2 truncate">
                            <span className={`text-[15px] font-bold ${selectedColor?.text}`}>
                                {getNombre(selectedOption.label)}
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border bg-white/50 font-bold uppercase tracking-wide ${selectedColor?.text} ${selectedColor?.border}`}>
                                {getEstado(selectedOption.label)}
                            </span>
                        </div>
                    ) : (
                        <span className="text-[15px] font-semibold text-[#2d4a2d] truncate">
                            — Haz clic para buscar o seleccionar un árbol —
                        </span>
                    )}
                </div>
                <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${selectedColor ? selectedColor.text : "text-[#aaa]"}`} />
            </div>

            {/* Menú desplegable flotante */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-[#e8f0e0] shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl z-50 overflow-hidden flex flex-col">
                    
                    {/* Buscador interno */}
                    <div className="p-3 border-b border-[#f0ece4] flex gap-3 items-center bg-[#fdfdfc]">
                        <Search size={16} className="text-[#aaa] shrink-0" />
                        <input 
                            type="text" 
                            className="w-full bg-transparent border-none outline-none text-sm text-[#2d4a2d] font-medium placeholder-[#aaa]" 
                            placeholder="Buscar por ID (Ej. 27) o estado (Ej. Crecimiento)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>

                    {/* Lista de opciones */}
                    <ul className="max-h-64 overflow-y-auto m-0 p-2 list-none custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <li className="px-4 py-6 text-sm text-[#aaa] text-center">
                                No se encontraron resultados
                            </li>
                        ) : (
                            filteredOptions.map((op) => {
                                const isSelected = op.valor === arbolId;
                                const estadoTxt = getEstado(op.label);
                                const nombreTxt = getNombre(op.label);
                                const c = getColorEstado(estadoTxt);

                                return (
                                    <li 
                                        key={op.valor}
                                        className={`px-4 py-2.5 mb-1 text-sm rounded-lg cursor-pointer transition-colors flex items-center justify-between
                                            ${isSelected ? `ring-2 ring-offset-1 ${c.ring} ${c.bg}` : "hover:bg-[#f5f5f5]"}
                                        `}
                                        onClick={() => {
                                            setArbolId(op.valor);
                                            setIsOpen(false);
                                            setSearchTerm("");
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-white/50 ${isSelected ? c.text.replace("text-", "bg-") : "bg-[#d4c9b0]"}`} />
                                            <span className={`${isSelected ? `font-bold ${c.text}` : "text-[#444] font-medium"}`}>
                                                {nombreTxt}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${isSelected ? `bg-white/50 ${c.text} ${c.border}` : `${c.bg} ${c.text} ${c.border}`}`}>
                                            {estadoTxt}
                                        </span>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
            
            {/* Custom scrollbar */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #d4c9b0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #c8d8c0;
                }
            `}</style>
        </div>
    );
};

// ── Componente ────────────────────────────────────────────────

const ArbolTimelinePage = () => {
    const {
        arbolId,
        setArbolId,
        arbolSeleccionado,
        opcionesArboles,
        fincas,
        eventos,
        loadingInit,
        loadingData,
        error,
    } = useArbolTimeline();

    const [filtroFinca, setFiltroFinca] = useState("");

    const opcionesFincas = fincas.map((f: any) => f.fin_nombre as string).sort();

    const opcionesFiltradas = filtroFinca
        ? opcionesArboles.filter(op => op.finca === filtroFinca)
        : opcionesArboles;

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
                    {/* Select de finca */}
                    <div className="mt-2 mb-3">
                        <label className={LABEL_CLS}>Finca</label>
                        <select
                            value={filtroFinca}
                            onChange={e => setFiltroFinca(e.target.value)}
                            className={INPUT_CLS}
                        >
                            <option value="">Todas las fincas</option>
                            {opcionesFincas.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    </div>

                    <label className={LABEL_CLS}>Seleccionar árbol</label>
                    {loadingInit ? (
                        <p className="text-sm text-[#7a9a7a] mt-2">Cargando árboles...</p>
                    ) : (
                        <TreeSelect
                            arbolId={arbolId}
                            setArbolId={setArbolId}
                            opcionesArboles={opcionesFiltradas}
                        />
                    )}

                    {/* Info rápida del árbol seleccionado */}
                    {arbolSeleccionado && (
                        <div className="mt-4 flex gap-6 text-sm flex-wrap">
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
                            <div>
                                <span className={LABEL_CLS}>Edad</span>
                                <p className="text-[#2d4a2d] font-semibold mt-0.5">
                                    {arbolSeleccionado.arb_fecha_siembra 
                                        ? `${calcularEdad(arbolSeleccionado.arb_fecha_siembra)} años`
                                        : "—"}
                                </p>
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
                                const cfg = EVENTO_CONFIG[evento.tipo];
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
