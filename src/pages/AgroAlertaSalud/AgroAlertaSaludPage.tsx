import { useState } from "react";
import { TriangleAlert, Plus, Pencil, Trash2, FlaskConical } from "lucide-react";
import { useAgroAlertaSalud } from "./UseAgroAlertaSalud";
import type { EstadoAlerta } from "./UseAgroAlertaSalud";
import { createAnalisisLaboratorio } from "../../api/agroAnalisisLaboratorio.api";
import { toast } from "sonner";

// ── Badge por estado ──────────────────────────────────────────
const ESTADO_BADGE: Record<EstadoAlerta, { clase: string }> = {
    "Pendiente":   { clase: "bg-[#fde8e0] text-[#a03020]" },
    "En análisis": { clase: "bg-[#fef9c3] text-[#854d0e]" },
    "Dictaminado": { clase: "bg-[#dcfce7] text-[#166534]" },
};

// ── Estilo compartido para inputs/selects del formulario ──────
const INPUT_CLS = "w-full mt-1.5 px-3 py-2.5 text-sm border-[1.5px] border-[#c8d8c0] rounded-lg bg-[#f9f6f0] text-[#2d4a2d] outline-none";
const LABEL_CLS = "text-[11px] font-bold text-[#6b8c6b] uppercase tracking-wider";

const AgroAlertaSaludPage = () => {
    const {
        alertasFiltradas,
        loading,
        error,
        filtroEstado,     setFiltroEstado,
        filtroFechaDesde, setFiltroFechaDesde,
        filtroFechaHasta, setFiltroFechaHasta,
        filtroFinca,      setFiltroFinca,
        opcionesFincas,
        modal,
        editando,
        form,
        setForm,
        guardando,
        formError,
        abrirCrear,
        abrirEditar,
        cerrarModal,
        handleGuardar,
        handleEliminar,
        opcionesArboles,
        opcionesUsuarios,
        recargar,
    } = useAgroAlertaSalud();

    const [hoveredRow,    setHoveredRow]    = useState<number | null>(null);
    const [enviando,      setEnviando]      = useState<number | null>(null);

    const hoy = () => new Date().toISOString().split("T")[0];

    const handleEnviarALab = async (alertsalud_id: number) => {
        try {
            setEnviando(alertsalud_id);
            await createAnalisisLaboratorio({
                alert_alerta_salud:        alertsalud_id,
                analab_laboratorio_nombre: "Pendiente de asignar",
                analab_fecha_envio:        hoy(),
            });
            toast.success("Alerta enviada al laboratorio");
            await recargar();
        } catch {
            toast.error("Error al enviar al laboratorio");
        } finally {
            setEnviando(null);
        }
    };

    const hayFiltros = filtroEstado || filtroFechaDesde || filtroFechaHasta || filtroFinca;

    const limpiarFiltros = () => {
        setFiltroEstado("");
        setFiltroFechaDesde("");
        setFiltroFechaHasta("");
        setFiltroFinca("");
    };

    // Campos del formulario modal
    const CAMPOS = [
        { key: "alertsalud_fecha_deteccion",     label: "Fecha de detección",  tipo: "date",   requerido: true  },
        { key: "alertsalud_descripcion_sintoma",  label: "Descripción síntoma", tipo: "text",   placeholder: "Ej: Hojas con manchas", requerido: false },
        { key: "alertsalud_foto",                label: "Foto",                 tipo: "text",   placeholder: "Ej: foto.jpg", requerido: false },
        { key: "arb_arbol",   label: "Árbol",   tipo: "select", requerido: true, opciones: opcionesArboles  },
        { key: "usu_usuario", label: "Usuario", tipo: "select", requerido: true, opciones: opcionesUsuarios },
    ] as const;

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
            <div className="max-w-[1100px] mx-auto">

                {/* ── Encabezado ─────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-7">
                    <div className="flex items-center gap-3.5">
                        <div className="bg-[#4a7c59] rounded-[14px] w-12 h-12 flex items-center justify-center shadow-[0_2px_8px_rgba(74,124,89,0.25)]">
                            <TriangleAlert size={24} color="#fff" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[#2d4a2d] m-0">Alertas de Salud</h1>
                            <p className="text-[13px] text-[#7a9a7a] mt-0.5">
                                AGRO_ALERTA_SALUD — {alertasFiltradas.length} alertas
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={abrirCrear}
                        className="flex items-center gap-1.5 bg-[#4a7c59] text-white text-sm font-semibold px-5 py-2.5 rounded-[10px] cursor-pointer border-none hover:bg-[#3d6b4a] transition-colors"
                    >
                        <Plus size={16} /> Nueva Alerta
                    </button>
                </div>

                {/* ── Barra de filtros ────────────────────────────────── */}
                <div className="bg-white rounded-xl px-5 py-4 mb-4 shadow-[0_2px_8px_rgba(74,124,89,0.07)] flex gap-4 items-end flex-wrap">

                    {/* Estado */}
                    <div className="flex flex-col">
                        <label className={LABEL_CLS}>Estado</label>
                        <select
                            value={filtroEstado}
                            onChange={e => setFiltroEstado(e.target.value as EstadoAlerta | "")}
                            className={`${INPUT_CLS} min-w-[160px]`}
                        >
                            <option value="">Todos</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="En análisis">En análisis</option>
                            <option value="Dictaminado">Dictaminado</option>
                        </select>
                    </div>

                    {/* Fecha desde */}
                    <div className="flex flex-col">
                        <label className={LABEL_CLS}>Fecha desde</label>
                        <input
                            type="date"
                            value={filtroFechaDesde}
                            onChange={e => setFiltroFechaDesde(e.target.value)}
                            className={INPUT_CLS}
                        />
                    </div>

                    {/* Fecha hasta */}
                    <div className="flex flex-col">
                        <label className={LABEL_CLS}>Fecha hasta</label>
                        <input
                            type="date"
                            value={filtroFechaHasta}
                            onChange={e => setFiltroFechaHasta(e.target.value)}
                            className={INPUT_CLS}
                        />
                    </div>

                    {/* Finca */}
                    <div className="flex flex-col">
                        <label className={LABEL_CLS}>Finca</label>
                        <select
                            value={filtroFinca}
                            onChange={e => setFiltroFinca(e.target.value)}
                            className={`${INPUT_CLS} min-w-[160px]`}
                        >
                            <option value="">Todas</option>
                            {opcionesFincas.map(nombre => (
                                <option key={nombre} value={nombre}>{nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Limpiar — aparece solo con filtros activos */}
                    {hayFiltros && (
                        <button
                            onClick={limpiarFiltros}
                            className="self-end bg-[#f0ece4] text-[#6b8c6b] text-[13px] font-semibold px-4 py-2.5 rounded-lg border-none cursor-pointer hover:bg-[#e5e0d8] transition-colors"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>

                {/* ── Tabla ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(74,124,89,0.08)]">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-[#e8f0e0]">
                                {["ID", "Fecha detección", "Descripción", "Finca", "Árbol", "Estado", "Acciones"].map(h => (
                                    <th key={h} className="px-5 py-3.5 text-[#4a7c59] font-bold text-[11px] uppercase tracking-wider text-center">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {alertasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-[#aaa]">
                                        No se encontraron alertas
                                    </td>
                                </tr>
                            ) : alertasFiltradas.map((alerta, i) => {
                                const badge  = ESTADO_BADGE[alerta.estado];
                                const fecha  = String((alerta as any).fecha_deteccion ?? "—").split("T")[0];
                                const isHover = hoveredRow === alerta.alertsalud_id;
                                const rowBg  = isHover ? "bg-[#f0f7f0]" : i % 2 === 0 ? "bg-white" : "bg-[#f9f6f0]";
                                return (
                                    <tr
                                        key={alerta.alertsalud_id}
                                        onMouseEnter={() => setHoveredRow(alerta.alertsalud_id)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                        className={`${rowBg} border-b border-[#eee] transition-colors duration-[120ms]`}
                                    >
                                        <td className="px-5 py-3 text-center text-[#6b8c6b]">
                                            {alerta.alertsalud_id}
                                        </td>
                                        <td className="px-5 py-3 text-center text-[#6b8c6b]">
                                            {fecha}
                                        </td>
                                        <td className="px-5 py-3 text-center text-[#6b8c6b] max-w-[200px]">
                                            {String((alerta as any).descripcion_sintoma ?? "—")}
                                        </td>
                                        <td className="px-5 py-3 text-center text-[#6b8c6b]">
                                            {alerta.fin_nombre}
                                        </td>
                                        <td className="px-5 py-3 text-center font-semibold text-[#2d4a2d]">
                                            #{alerta.arb_arbol}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`${badge.clase} px-3 py-1 rounded-full text-xs font-semibold`}>
                                                {alerta.estado}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                {alerta.estado === "Pendiente" && (
                                                    <button
                                                        onClick={() => handleEnviarALab(alerta.alertsalud_id)}
                                                        disabled={enviando === alerta.alertsalud_id}
                                                        className="flex items-center gap-1 bg-[#dbeafe] text-[#1e40af] text-xs font-semibold px-3.5 py-1.5 rounded-lg border-none cursor-pointer hover:bg-[#bfdbfe] transition-colors disabled:opacity-60"
                                                    >
                                                        <FlaskConical size={12} /> {enviando === alerta.alertsalud_id ? "Enviando..." : "Enviar a Lab"}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => abrirEditar(alerta)}
                                                    className="flex items-center gap-1 bg-[#ddeedd] text-[#2d6a4f] text-xs font-semibold px-3.5 py-1.5 rounded-lg border-none cursor-pointer hover:bg-[#cde2cd] transition-colors"
                                                >
                                                    <Pencil size={12} /> Editar
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(alerta)}
                                                    className="flex items-center gap-1 bg-[#fde8e0] text-[#a03020] text-xs font-semibold px-3.5 py-1.5 rounded-lg border-none cursor-pointer hover:bg-[#f5d8ce] transition-colors"
                                                >
                                                    <Trash2 size={12} /> Desactivar
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

            {/* ── Modal crear / editar ─────────────────────────────── */}
            {modal && (
                <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-[440px] shadow-[0_8px_40px_rgba(0,0,0,0.18)]">

                        {/* Cabecera */}
                        <div className="flex items-center gap-2.5 mb-6">
                            <TriangleAlert size={20} color="#4a7c59" />
                            <h2 className="text-lg font-bold text-[#2d4a2d] m-0">
                                {editando ? "Editar alerta" : "Nueva alerta"}
                            </h2>
                        </div>

                        {/* Campos */}
                        <div className="flex flex-col gap-3.5">
                            {CAMPOS.map(campo => (
                                <div key={campo.key}>
                                    <label className={LABEL_CLS}>
                                        {campo.label}{campo.requerido ? " *" : ""}
                                    </label>

                                    {"opciones" in campo ? (
                                        <select
                                            value={String((form as any)[campo.key] ?? "")}
                                            onChange={e => setForm({ ...form, [campo.key]: e.target.value } as any)}
                                            className={INPUT_CLS}
                                        >
                                            <option value="">Selecciona...</option>
                                            {campo.opciones.map(op => (
                                                <option key={op.valor} value={op.valor}>{op.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={campo.tipo}
                                            value={String((form as any)[campo.key] ?? "")}
                                            onChange={e => setForm({ ...form, [campo.key]: e.target.value } as any)}
                                            placeholder={"placeholder" in campo ? campo.placeholder : undefined}
                                            className={INPUT_CLS}
                                        />
                                    )}
                                </div>
                            ))}

                            {formError && (
                                <p className="text-red-600 text-xs m-0">{formError}</p>
                            )}
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-2.5 mt-7">
                            <button
                                onClick={cerrarModal}
                                className="px-5 py-2.5 text-sm bg-[#f0ece4] text-[#6b8c6b] rounded-[10px] border-none cursor-pointer hover:bg-[#e5e0d8] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={guardando}
                                className="px-5 py-2.5 text-sm font-semibold bg-[#4a7c59] text-white rounded-[10px] border-none cursor-pointer hover:bg-[#3d6b4a] transition-colors disabled:opacity-60"
                            >
                                {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgroAlertaSaludPage;
