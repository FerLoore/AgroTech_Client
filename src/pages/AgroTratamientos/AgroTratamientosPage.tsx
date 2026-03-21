import { ClipboardList } from "lucide-react";
import { useAgroTratamientos } from "./UseAgroTratamientos";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

const COLUMNAS: ColumnaConfig[] = [
    { header: "ID", key: "trata_tratamientos" },
    { header: "Fecha inicio", key: "trata_fecha_inicio" },
    { header: "Fecha fin", key: "trata_fecha_fin" },
    { header: "Estado", key: "trata_estado" },
    { header: "Dosis", key: "trata_dosis" },
    { header: "Observaciones", key: "trata_observaciones" },
    { header: "Alerta Salud", key: "alertsalu_alerta_salud" },
    { header: "Producto", key: "produ_producto" },
];

const CAMPOS: CampoFormulario[] = [
    {
        key: "trata_fecha_inicio",
        label: "Fecha de inicio",
        tipo: "text",
        placeholder: "Ej: 2026-03-18",
        requerido: true,
    },
    {
        key: "trata_fecha_fin",
        label: "Fecha de fin",
        tipo: "text",
        placeholder: "Ej: 2026-03-25",
    },
    {
        key: "trata_estado",
        label: "Estado",
        tipo: "text",
        placeholder: "Ej: En curso",
        requerido: true,
    },
    {
        key: "trata_dosis",
        label: "Dosis",
        tipo: "text",
        placeholder: "Ej: 10 ml por litro",
    },
    {
        key: "trata_observaciones",
        label: "Observaciones",
        tipo: "text",
        placeholder: "Ej: Aplicación inicial",
    },
    {
        key: "alertsalu_alerta_salud",
        label: "Alerta Salud",
        tipo: "text",
        placeholder: "Ej: 1",
        requerido: true,
    },
    {
        key: "produ_producto",
        label: "Producto",
        tipo: "text",
        placeholder: "Ej: 1",
        requerido: true,
    },
];

const AgroTratamientosPage = () => {
    const {
        tratamientosFiltrados,
        loading,
        error,
        busqueda,
        setBusqueda,
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
    } = useAgroTratamientos();

    return (
        <CrudTabla
            titulo="Tratamientos"
            subtitulo="AGRO_TRATAMIENTOS"
            icono={ClipboardList}
            columnas={COLUMNAS}
            datos={tratamientosFiltrados}
            idKey="trata_tratamientos"
            campos={CAMPOS}
            loading={loading}
            error={error}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            modal={modal}
            editando={editando}
            form={form}
            setForm={setForm as (f: Record<string, unknown>) => void}
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