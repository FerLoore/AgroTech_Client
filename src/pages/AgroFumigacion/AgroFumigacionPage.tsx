import { Calendar } from "lucide-react";
import { useAgroFumigacion } from "./UseAgroFumigacion";
// CORRECCIÓN 1: Separar importación de componente y tipos
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

const AgroFumigacionPage = () => {
    const {
        fumigaciones, productos, secciones, loading, error, busqueda, setBusqueda,
        modal, form, setForm, guardando, formError,
        abrirCrear, cerrarModal, handleGuardar, onRealizadaClick
    } = useAgroFumigacion();

    // CORRECCIÓN 2: Eliminados 'formato' y 'badge' que no existen en ColumnaConfig
    const COLUMNAS: ColumnaConfig[] = [
        { header: "ID", key: "fumi_fumigacion" },
        { header: "Fecha Programada", key: "fumi_fecha_programada" },
        { header: "Producto", key: "fumi_producto_nom" },
        { header: "Sección", key: "fumi_seccion_nom" },
        { header: "Dosis", key: "fumi_dosis" },
        { header: "Estado", key: "fumi_estado" }
    ];

    const CAMPOS: CampoFormulario[] = [
        { key: "fumi_fecha_programada", label: "Fecha a Programar", tipo: "date", requerido: true },
        { 
            key: "fumi_producto", 
            label: "Producto a Aplicar", 
            tipo: "select", 
            opciones: (productos || []).map(p => ({
                valor: String(p?.produ_producto),
                label: p?.produ_nombre
            })),
            requerido: true 
        },
        { 
            key: "fumi_seccion", 
            label: "Sección", 
            tipo: "select", 
            opciones: (secciones || []).map(s => ({
                valor: String(s?.secc_seccion),
                label: s?.secc_nombre || `Sección ${s?.secc_seccion}`
            })),
            requerido: true 
        },
        { key: "fumi_dosis", label: "Dosis Recomendada", tipo: "text", requerido: true }
    ];

    return (
        <CrudTabla
            titulo="Programa de Fumigación"
            subtitulo="Calendario de Aplicaciones Preventivas"
            icono={Calendar}
            columnas={COLUMNAS}
            datos={fumigaciones}
            idKey="fumi_fumigacion"
            campos={CAMPOS}
            loading={loading}
            error={error}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            modal={modal}
            editando={null} 
            form={form}
            setForm={setForm as (f: Record<string, unknown>) => void}
            guardando={guardando}
            formError={formError}
            onNuevo={abrirCrear}
            onEliminar={onRealizadaClick} 
            labelEliminar="Realizar"
            onGuardar={handleGuardar}
            onCerrar={cerrarModal}
        />
    );
};

export default AgroFumigacionPage;