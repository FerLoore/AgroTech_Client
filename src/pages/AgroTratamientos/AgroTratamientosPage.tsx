import React, { useState } from "react";
import { ClipboardList, Filter, LayoutGrid, Table as TableIcon } from "lucide-react";
import { useAgroTratamientos } from "./UseAgroTratamientos";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";
import AgroTratamientoTracking from "./AgroTratamientoTracking";

const COLUMNAS: ColumnaConfig[] = [
    { header: "ID", key: "trata_tratamientos" },
    { 
        header: "Tipo", 
        key: "trata_tipo",
        badge: {
            "Curativo":   { label: "Curativo",   bg: "#e0f2fe", text: "#0369a1" },
            "Preventivo": { label: "Preventivo", bg: "#f3e8ff", text: "#7e22ce" }
        }
    },
    { header: "Objetivo", key: "ui_arbol_id" },
    { header: "Inicio", key: "trata_fecha_inicio" },
    { 
        header: "Estado", 
        key: "trata_estado",
        badge: {
            "En curso":   { label: "En curso",   bg: "#fef3c7", text: "#92400e" },
            "Finalizado": { label: "Finalizado", bg: "#dcfce7", text: "#166534" },
            "Cancelado":  { label: "Cancelado",  bg: "#fee2e2", text: "#991b1b" }
        }
    },
    { header: "Dosis", key: "trata_dosis" },
    { header: "Producto", key: "ui_producto_nombre" },
];

const CAMPOS = (
    opcionesAlertas: CampoFormulario["opciones"],
    opcionesProductos: CampoFormulario["opciones"],
    opcionesSecciones: CampoFormulario["opciones"],
    opcionesFincas: CampoFormulario["opciones"],
    tipoActual: string,
    filtroFincaForm: string,
    setFiltroFincaForm: (v: string) => void
): CampoFormulario[] => [
    {
        key: "trata_tipo",
        label: "Tipo de Aplicación",
        tipo: "select",
        requerido: true,
        opciones: [
            { valor: "Curativo", label: "Curativo (Basado en Diagnóstico)" },
            { valor: "Preventivo", label: "Preventivo (Por Sección)" },
        ],
    },
    {
        key: "trata_fecha_inicio",
        label: "Fecha de inicio",
        tipo: "date",
        requerido: true,
    },
    {
        key: "trata_estado",
        label: "Estado",
        tipo: "select",
        requerido: true,
        opciones: [
            { valor: "En curso",    label: "En curso"    },
            { valor: "Finalizado",  label: "Finalizado"  },
            { valor: "Cancelado",   label: "Cancelado"   },
        ],
    },
    {
        key: "trata_dosis",
        label: "Dosis (Cantidad a descontar)",
        tipo: "text",
        placeholder: "Ej: 10",
    },
    // Filtro de Finca (SOLO UI para filtrar alertas)
    ...(tipoActual === "Curativo" ? [{
        key: "ui_filtro_finca",
        label: "Filtrar Alertas por Finca",
        tipo: "select" as const,
        opciones: opcionesFincas,
    }] : []),
    // Condicional: Solo si el tipo es Curativo
    ...(tipoActual === "Curativo" ? [{
        key: "alertsalu_alerta_salud",
        label: "Alerta con Diagnóstico Positivo",
        tipo: "select" as const,
        requerido: true,
        opciones: opcionesAlertas,
    }] : []),
    // Condicional: Solo si el tipo es Preventivo
    ...(tipoActual === "Preventivo" ? [{
        key: "secc_seccion",
        label: "Sección a Fumigar",
        tipo: "select" as const,
        requerido: true,
        opciones: opcionesSecciones,
    }] : []),
    {
        key: "produ_producto",
        label: "Producto",
        tipo: "select",
        requerido: true,
        opciones: opcionesProductos,
    },
    {
        key: "trata_observaciones",
        label: "Observaciones",
        tipo: "text",
        placeholder: "Ej: Aplicación inicial",
    },
];

const AgroTratamientosPage = () => {
    const [view, setView] = useState<"table" | "tracking">("table");

    // Detectar intención de receta desde Laboratorio
    React.useEffect(() => {
        const pending = localStorage.getItem("agro_pending_recipe");
        if (pending) {
            setView("tracking");
        }
    }, []);

    const {
        tratamientosFiltrados,
        loading,
        error,
        busqueda, setBusqueda,
        filtroEstado, setFiltroEstado,
        filtroProducto, setFiltroProducto,
        filtroFechaDesde, setFiltroFechaDesde,
        filtroFechaHasta, setFiltroFechaHasta,
        filtroFincaTabla, setFiltroFincaTabla,
        filtroFincaForm, setFiltroFincaForm,
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
        opcionesAlertas,
        opcionesProductos,
        opcionesSecciones,
        opcionesFincas
    } = useAgroTratamientos();

    const selectStyle = {
        padding: "8px 12px",
        fontSize: "13px",
        border: "1.5px solid #c8d8c0",
        borderRadius: "8px",
        background: "#fff",
        color: "#2d4a2d",
        outline: "none"
    };

    const extraFilters = (
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", background: "#f3f4f6", padding: "4px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <button 
                    onClick={() => setView("table")}
                    style={{
                        padding: "6px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        background: view === "table" ? "#fff" : "transparent",
                        color: view === "table" ? "#2d6a4f" : "#6b7280",
                        boxShadow: view === "table" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                    }}
                >
                    <TableIcon size={14} /> Tabla
                </button>
                <button 
                    onClick={() => setView("tracking")}
                    style={{
                        padding: "6px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        background: view === "tracking" ? "#fff" : "transparent",
                        color: view === "tracking" ? "#2d6a4f" : "#6b7280",
                        boxShadow: view === "tracking" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                    }}
                >
                    <LayoutGrid size={14} /> Seguimiento
                </button>
            </div>

            {view === "table" && (
                <>
                    <div style={{ width: "1px", height: "24px", background: "#e5e7eb" }}></div>
                    <Filter size={14} color="#4a7c59" />
                    <select 
                        value={filtroEstado} 
                        onChange={e => setFiltroEstado(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="">Estado...</option>
                        <option value="En curso">En curso</option>
                        <option value="Finalizado">Finalizado</option>
                        <option value="Cancelado">Cancelado</option>
                    </select>

                    <select 
                        value={filtroProducto} 
                        onChange={e => setFiltroProducto(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="">Producto...</option>
                        {opcionesProductos.map(p => (
                            <option key={p.valor} value={p.valor}>{p.label}</option>
                        ))}
                    </select>

                    <select 
                        value={filtroFincaTabla} 
                        onChange={e => setFiltroFincaTabla(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="">Finca...</option>
                        {opcionesFincas.map(f => (
                            <option key={f.valor} value={f.valor}>{f.label}</option>
                        ))}
                    </select>

                    <input 
                        type="date" 
                        value={filtroFechaDesde} 
                        onChange={e => setFiltroFechaDesde(e.target.value)}
                        style={selectStyle}
                    />
                    <span style={{ color: "#7a9a7a", fontSize: "12px" }}>—</span>
                    <input 
                        type="date" 
                        value={filtroFechaHasta} 
                        onChange={e => setFiltroFechaHasta(e.target.value)}
                        style={selectStyle}
                    />
                </>
            )}
        </div>
    );

    // Sobrecarga del setForm para capturar el cambio del filtro de finca en el modal
    const handleSetForm = (newForm: any) => {
        if (newForm.ui_filtro_finca !== undefined && newForm.ui_filtro_finca !== filtroFincaForm) {
            setFiltroFincaForm(newForm.ui_filtro_finca);
        }
        setForm(newForm);
    };

    return (
        <div style={{ height: "100%", width: "100%" }}>
            {view === "tracking" ? (
                <div style={{ padding: "0 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", marginTop: "24px" }}>
                        <div>
                            <h1 style={{ fontSize: "24px", color: "#111827", fontWeight: 700 }}>Seguimiento por Árbol</h1>
                            <p style={{ color: "#6b7280", fontSize: "14px" }}>Visualiza el fitociclo y la evolución de tratamientos individuales</p>
                        </div>
                        {extraFilters}
                    </div>
                    <AgroTratamientoTracking />
                </div>
            ) : (
                <CrudTabla
                    titulo="Tratamientos y Fitociclo"
                    subtitulo="Gestión de prescripciones y aplicaciones fitosanitarias"
                    icono={ClipboardList}
                    columnas={COLUMNAS}
                    datos={tratamientosFiltrados}
                    idKey="trata_tratamientos"
                    campos={CAMPOS(opcionesAlertas, opcionesProductos, opcionesSecciones, opcionesFincas, String(form.trata_tipo), filtroFincaForm, setFiltroFincaForm)}
                    loading={loading}
                    error={error}
                    busqueda={busqueda}
                    setBusqueda={setBusqueda}
                    extraFilters={extraFilters}
                    modal={modal}
                    editando={editando}
                    form={form}
                    setForm={handleSetForm}
                    guardando={guardando}
                    formError={formError}
                    onNuevo={abrirCrear}
                    onEditar={abrirEditar}
                    onEliminar={handleEliminar}
                    onGuardar={handleGuardar}
                    onCerrar={cerrarModal}
                    labelEliminar="Eliminar"
                />
            )}
        </div>
    );
};

export default AgroTratamientosPage;