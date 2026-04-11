import React from "react";
import { ClipboardList, Filter } from "lucide-react";
import { useAgroTratamientos } from "./UseAgroTratamientos";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

const COLUMNAS: ColumnaConfig[] = [
    { header: "ID", key: "trata_tratamientos" },
    { 
        header: "Tipo", 
        key: "trata_tipo",
        badge: {
            "Curativo":   { label: "Curativo",   bg: "#dbeafe", text: "#1d4ed8" },
            "Preventivo": { label: "Preventivo", bg: "#f3e8ff", text: "#7e22ce" }
        }
    },
    { header: "Fecha inicio", key: "trata_fecha_inicio" },
    { header: "Estado", key: "trata_estado" },
    { header: "Dosis", key: "trata_dosis" },
    { 
        header: "Alerta/Sección", 
        key: "alertsalu_alerta_salud", 
        render: (val: any, item: any) => {
            const esCurativo = item.trata_tipo === "Curativo";
            return (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#4b5563" }}>
                        {esCurativo ? `Alerta #${val || '—'}` : `Sección #${item.secc_seccion || '—'}`}
                    </span>
                    <span style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {esCurativo ? "Diagnóstico" : "Preventivo"}
                    </span>
                </div>
            );
        }
    },
    { header: "Producto", key: "produ_producto" },
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
    const {
        tratamientosFiltrados,
        loading,
        error,
        busqueda, setBusqueda,
        filtroEstado, setFiltroEstado,
        filtroProducto, setFiltroProducto,
        filtroFechaDesde, setFiltroFechaDesde,
        filtroFechaHasta, setFiltroFechaHasta,
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
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
    );
};

export default AgroTratamientosPage;