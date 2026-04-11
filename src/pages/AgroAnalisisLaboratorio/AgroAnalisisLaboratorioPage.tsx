import { useState } from "react";
import { FlaskConical, ClipboardCheck, TreePine, AlertCircle, Database, Pencil, Filter, Trash2 } from "lucide-react";
import { useRegistroAnalisis } from "./useRegistroAnalisis";

// ── Estilos compartidos ───────────────────────────────────────
const INPUT_CLS = "w-full mt-1.5 px-3 py-2.5 text-sm border-[1.5px] border-[#c8d8c0] rounded-lg bg-[#f9f6f0] text-[#2d4a2d] outline-none focus:border-[#4a7c59] transition-colors";
const LABEL_CLS = "text-[11px] font-bold text-[#6b8c6b] uppercase tracking-wider";

const ESTADO_BADGE: Record<string, string> = {
    "Pendiente":   "bg-[#fef9c3] text-[#854d0e]",
    "En análisis": "bg-[#fde8e0] text-[#a03020]",
};

const RESULTADO_BADGE: Record<string, string> = {
    "Positivo": "bg-[#dcfce7] text-[#166534]",
    "Negativo": "bg-[#fde8e0] text-[#a03020]",
    "Pendiente": "bg-[#fef9c3] text-[#854d0e]",
};

const AgroAnalisisLaboratorioPage = () => {
    const {
        alertasActivas,
        analisis,
        alertas,
        arboles,
        filtroFinca,
        setFiltroFinca,
        opcionesFincas,
        alertaSeleccionada,
        analisisEditandoId,
        editarAnalisis,
        seleccionarAlerta,
        arbolSeleccionado,
        opcionesPatogenos,
        form,
        setForm,
        guardando,
        formError,
        handleGuardar,
        handleEliminar,
        loading,
        error,
    } = useRegistroAnalisis();

    const [usarPatogenoCustom, setUsarPatogenoCustom] = useState(false);
    const [patogenoCustom,     setPatogenoCustom]     = useState("");
    const [patogenoTipo,       setPatogenoTipo]       = useState("Hongo");

    const resetPatogenoCustom = () => { setUsarPatogenoCustom(false); setPatogenoCustom(""); setPatogenoTipo("Hongo"); };

    // ── Estados de carga ──────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center h-[300px]">
            <p className="text-[#5a7a5a] text-lg">Cargando...</p>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-[300px]">
            <p className="text-red-600 text-lg">{error}</p>
        </div>
    );

    return (
        <div className="p-8">
            <div className="max-w-[1200px] mx-auto">

                {/* ── Encabezado ─────────────────────────────────────── */}
                <div className="flex items-center gap-3.5 mb-7">
                    <div className="bg-[#4a7c59] rounded-[14px] w-12 h-12 flex items-center justify-center shadow-[0_2px_8px_rgba(74,124,89,0.25)]">
                        <FlaskConical size={24} color="#fff" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#2d4a2d] m-0">Registro de Análisis</h1>
                        <p className="text-[13px] text-[#7a9a7a] mt-0.5">
                            Selecciona una alerta activa para registrar o actualizar su análisis
                        </p>
                    </div>
                </div>

                {/* ── Filtro por finca ───────────────────────────────── */}
                <div className="flex items-center gap-3 mb-5">
                    <Filter size={15} color="#4a7c59" />
                    <span className="text-[11px] font-bold text-[#6b8c6b] uppercase tracking-wider">Finca</span>
                    <select
                        value={filtroFinca}
                        onChange={e => setFiltroFinca(e.target.value)}
                        className="px-3 py-2 text-sm border-[1.5px] border-[#c8d8c0] rounded-lg bg-[#f9f6f0] text-[#2d4a2d] outline-none focus:border-[#4a7c59] transition-colors"
                    >
                        <option value="">Todas las fincas</option>
                        {opcionesFincas.map(op => (
                            <option key={op.valor} value={op.valor}>{op.label}</option>
                        ))}
                    </select>
                </div>

                {/* ── Layout dos columnas ────────────────────────────── */}
                <div className="flex gap-6 items-start">

                    {/* ── Panel izquierdo: lista de alertas activas ────── */}
                    <div className="w-[380px] shrink-0">
                        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(74,124,89,0.08)] overflow-hidden">
                            <div className="bg-[#e8f0e0] px-5 py-3.5 flex items-center gap-2">
                                <AlertCircle size={15} color="#4a7c59" />
                                <span className="text-[11px] font-bold text-[#4a7c59] uppercase tracking-wider">
                                    Alertas activas — {alertasActivas.length}
                                </span>
                            </div>

                            {alertasActivas.length === 0 ? (
                                <div className="px-5 py-10 text-center text-[#aaa] text-sm">
                                    No hay alertas pendientes o en análisis
                                </div>
                            ) : (
                                <ul className="divide-y divide-[#f0ece4]">
                                    {alertasActivas.map(alerta => {
                                        const isSelected = alertaSeleccionada?.alertsalud_id === alerta.alertsalud_id;
                                        return (
                                            <li
                                                key={alerta.alertsalud_id}
                                                onClick={() => { seleccionarAlerta(alerta); resetPatogenoCustom(); }}
                                                className={`px-5 py-4 cursor-pointer transition-colors duration-[120ms] ${
                                                    isSelected
                                                        ? "bg-[#e8f5ec] border-l-[3px] border-l-[#4a7c59]"
                                                        : "hover:bg-[#f9f6f0]"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-sm font-bold text-[#2d4a2d]">
                                                        Alerta #{alerta.alertsalud_id}
                                                    </span>
                                                    <span className={`${ESTADO_BADGE[alerta.estado]} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                                                        {alerta.estado}
                                                    </span>
                                                </div>
                                                <p className="text-[12px] text-[#6b8c6b] m-0">
                                                    Árbol #{alerta.arb_arbol}
                                                </p>
                                                <p className="text-[12px] text-[#8aaa8a] mt-0.5 m-0">
                                                    {alerta.fecha_deteccion} — {alerta.descripcion_sintoma}
                                                </p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* ── Panel derecho: detalle + formulario ──────────── */}
                    <div className="flex-1 min-w-0">

                        {!alertaSeleccionada ? (
                            <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(74,124,89,0.08)] flex flex-col items-center justify-center py-16 text-center">
                                <FlaskConical size={40} color="#c8d8c0" />
                                <p className="text-[#aaa] text-sm mt-3">
                                    Selecciona una alerta de la lista para comenzar
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">

                                {/* Info del árbol y la alerta */}
                                <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(74,124,89,0.08)] p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TreePine size={16} color="#4a7c59" />
                                        <span className="text-[11px] font-bold text-[#4a7c59] uppercase tracking-wider">
                                            Información del árbol
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                        <div>
                                            <span className={LABEL_CLS}>Alerta</span>
                                            <p className="text-[#2d4a2d] font-semibold mt-0.5">
                                                #{alertaSeleccionada.alertsalud_id}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={LABEL_CLS}>Estado</span>
                                            <p className="mt-0.5">
                                                <span className={`${ESTADO_BADGE[alertaSeleccionada.estado]} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                                                    {alertaSeleccionada.estado}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <span className={LABEL_CLS}>Árbol</span>
                                            <p className="text-[#2d4a2d] font-semibold mt-0.5">
                                                #{alertaSeleccionada.arb_arbol}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={LABEL_CLS}>Fecha detección</span>
                                            <p className="text-[#2d4a2d] mt-0.5">
                                                {alertaSeleccionada.fecha_deteccion}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className={LABEL_CLS}>Síntoma</span>
                                            <p className="text-[#2d4a2d] mt-0.5">
                                                {alertaSeleccionada.descripcion_sintoma}
                                            </p>
                                        </div>
                                        {arbolSeleccionado && (
                                            <div>
                                                <span className={LABEL_CLS}>Estado del árbol</span>
                                                <p className="text-[#2d4a2d] mt-0.5">
                                                    {arbolSeleccionado.arb_estado ?? "—"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Formulario de análisis */}
                                <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(74,124,89,0.08)] p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <ClipboardCheck size={16} color="#4a7c59" />
                                        <span className="text-[11px] font-bold text-[#4a7c59] uppercase tracking-wider">
                                            {alertaSeleccionada.estado === "Pendiente"
                                                ? "Registrar análisis"
                                                : "Actualizar resultado"}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">

                                        {/* Laboratorio */}
                                        <div className="col-span-2">
                                            <label className={LABEL_CLS}>Nombre del laboratorio *</label>
                                            <input
                                                type="text"
                                                value={form.analab_laboratorio_nombre}
                                                onChange={e => setForm({ ...form, analab_laboratorio_nombre: e.target.value })}
                                                placeholder="Ej: Laboratorio Central Agrícola"
                                                className={INPUT_CLS}
                                            />
                                        </div>

                                        {/* Patógeno */}
                                        <div className="col-span-2">
                                            <label className={LABEL_CLS}>Patógeno</label>
                                            <select
                                                value={usarPatogenoCustom ? "__nuevo__" : form.catpato_catalogo_patogeno}
                                                onChange={e => {
                                                    if (e.target.value === "__nuevo__") {
                                                        setUsarPatogenoCustom(true);
                                                        setPatogenoCustom("");
                                                        setForm({ ...form, catpato_catalogo_patogeno: "" });
                                                    } else {
                                                        setUsarPatogenoCustom(false);
                                                        setPatogenoCustom("");
                                                        setForm({ ...form, catpato_catalogo_patogeno: e.target.value });
                                                    }
                                                }}
                                                className={INPUT_CLS}
                                            >
                                                <option value="">Selecciona un patógeno...</option>
                                                {opcionesPatogenos.map(op => (
                                                    <option key={op.valor} value={op.valor}>{op.label}</option>
                                                ))}
                                                <option value="__nuevo__">+ Agregar nuevo patógeno</option>
                                            </select>
                                            {usarPatogenoCustom && (
                                                <div className="flex flex-col gap-3 mt-3">
                                                    <div>
                                                        <label className={LABEL_CLS}>Nombre del patógeno *</label>
                                                        <input
                                                            type="text"
                                                            value={patogenoCustom}
                                                            onChange={e => setPatogenoCustom(e.target.value)}
                                                            placeholder="Ej: Fusarium, Mosca blanca..."
                                                            className={INPUT_CLS}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={LABEL_CLS}>Tipo *</label>
                                                        <select
                                                            value={patogenoTipo}
                                                            onChange={e => setPatogenoTipo(e.target.value)}
                                                            className={INPUT_CLS}
                                                        >
                                                            <option value="Hongo">Hongo</option>
                                                            <option value="Bacteria">Bacteria</option>
                                                            <option value="Plaga">Plaga</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Fecha envío */}
                                        <div>
                                            <label className={LABEL_CLS}>Fecha de envío *</label>
                                            <input
                                                type="date"
                                                value={form.analab_fecha_envio}
                                                onChange={e => setForm({ ...form, analab_fecha_envio: e.target.value })}
                                                className={INPUT_CLS}
                                            />
                                        </div>

                                        {/* Fecha resultado */}
                                        <div>
                                            <label className={LABEL_CLS}>Fecha de resultado</label>
                                            <input
                                                type="date"
                                                value={form.analab_fecha_resultado}
                                                onChange={e => setForm({ ...form, analab_fecha_resultado: e.target.value })}
                                                className={INPUT_CLS}
                                            />
                                        </div>

                                        {/* Tipo resultado */}
                                        <div className="col-span-2">
                                            <label className={LABEL_CLS}>Tipo de resultado</label>
                                            <select
                                                value={form.analab_resultado_tipo}
                                                onChange={e => setForm({ ...form, analab_resultado_tipo: e.target.value })}
                                                className={INPUT_CLS}
                                            >
                                                <option value="">Sin resultado aún</option>
                                                <option value="Positivo">Positivo</option>
                                                <option value="Negativo">Negativo</option>
                                                <option value="Pendiente">Pendiente</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Aviso resultado positivo */}
                                    {form.analab_resultado_tipo === "Positivo" && (
                                        <div className="mt-4 bg-[#dcfce7] border border-[#86efac] rounded-lg px-4 py-3 text-[13px] text-[#166534]">
                                            El árbol #{alertaSeleccionada.arb_arbol} quedará registrado con resultado <strong>Positivo</strong>.
                                        </div>
                                    )}

                                    {formError && (
                                        <p className="text-red-600 text-xs mt-3">{formError}</p>
                                    )}

                                    {/* Botón guardar */}
                                    <div className="flex justify-end mt-6">
                                        <button
                                            onClick={() => handleGuardar(usarPatogenoCustom ? patogenoCustom : undefined, usarPatogenoCustom ? patogenoTipo : undefined)}
                                            disabled={guardando}
                                            className="flex items-center gap-2 bg-[#4a7c59] text-white text-sm font-semibold px-6 py-2.5 rounded-[10px] border-none cursor-pointer hover:bg-[#3d6b4a] transition-colors disabled:opacity-60"
                                        >
                                            <ClipboardCheck size={15} />
                                            {guardando ? "Guardando..." : alertaSeleccionada.estado === "Pendiente" ? "Registrar análisis" : "Guardar resultado"}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
                {/* ── Tabla: análisis registrados ───────────────────── */}
                <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(74,124,89,0.08)] overflow-hidden mt-6">
                    <div className="bg-[#e8f0e0] px-5 py-3.5 flex items-center gap-2">
                        <Database size={15} color="#4a7c59" />
                        <span className="text-[11px] font-bold text-[#4a7c59] uppercase tracking-wider">
                            Análisis registrados — {analisis.length}{filtroFinca ? ` (${filtroFinca})` : ""}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[#eee]">
                                    {["ID", "Laboratorio", "Fecha envío", "Fecha resultado", "Resultado", "Alerta", "Árbol", ""].map(h => (
                                        <th key={h} className="px-4 py-3 text-[#4a7c59] font-bold text-[11px] uppercase tracking-wider text-center">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {analisis.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-[#aaa] text-sm">
                                            No hay análisis registrados
                                        </td>
                                    </tr>
                                ) : analisis.map((an, i) => {
                                    const toDate = (d: string) => d ? String(d).split("T")[0] : "—";
                                    const resultadoBadge = an.analab_resultado_tipo
                                        ? RESULTADO_BADGE[an.analab_resultado_tipo] ?? "bg-[#f0ece4] text-[#6b8c6b]"
                                        : null;
                                    return (
                                        <tr
                                            key={an.analab_analisis_laboratorio}
                                            className={`border-b border-[#eee] ${i % 2 === 0 ? "bg-white" : "bg-[#f9f6f0]"}`}
                                        >
                                            <td className="px-4 py-2.5 text-center text-[#6b8c6b]">{an.analab_analisis_laboratorio}</td>
                                            <td className="px-4 py-2.5 text-center text-[#2d4a2d]">{an.analab_laboratorio_nombre || "—"}</td>
                                            <td className="px-4 py-2.5 text-center text-[#6b8c6b]">{toDate(an.analab_fecha_envio)}</td>
                                            <td className="px-4 py-2.5 text-center text-[#6b8c6b]">{toDate(an.analab_fecha_resultado)}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                {resultadoBadge ? (
                                                    <span className={`${resultadoBadge} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
                                                        {an.analab_resultado_tipo}
                                                    </span>
                                                ) : <span className="text-[#aaa]">—</span>}
                                            </td>
                                            <td className="px-4 py-2.5 text-center text-[#6b8c6b]">#{an.alert_alerta_salud}</td>
                                            <td className="px-4 py-2.5 text-center text-[#2d4a2d] font-semibold">
                                                {(() => {
                                                    const alerta = alertas.find((a: any) => Number(a.alertsalud_id) === Number(an.alert_alerta_salud));
                                                    const arbol  = alerta ? arboles.find((a: any) => Number(a.arb_arbol) === Number(alerta.arb_arbol)) : null;
                                                    return arbol ? `#${arbol.arb_arbol} - Surco ${arbol.sur_surcos}` : "—";
                                                })()}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => { editarAnalisis(an); resetPatogenoCustom(); }}
                                                        className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors ${
                                                            analisisEditandoId === Number(an.analab_analisis_laboratorio)
                                                                ? "bg-[#4a7c59] text-white"
                                                                : "bg-[#ddeedd] text-[#2d6a4f] hover:bg-[#cde2cd]"
                                                        }`}
                                                    >
                                                        <Pencil size={11} /> Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleEliminar(an)}
                                                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors bg-[#fde8e0] text-[#a03020] hover:bg-[#fbd3c1]"
                                                    >
                                                        <Trash2 size={11} /> Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AgroAnalisisLaboratorioPage;
