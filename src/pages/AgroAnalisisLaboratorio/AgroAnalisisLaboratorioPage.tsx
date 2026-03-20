import { FlaskConical } from "lucide-react";
import { useAgroAnalisisLaboratorio } from "./UseAgroAnalisisLaboratorio";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

const COLUMNAS: ColumnaConfig[] = [
    { header: "ID", key: "analab_analisis_laboratorio" },
    { header: "Laboratorio", key: "analab_laboratorio_nombre" },
    { header: "Fecha envío", key: "analab_fecha_envio" },
    { header: "Fecha resultado", key: "analab_fecha_resultado" },
    { header: "Resultado", key: "analab_resultado_tipo" },
    { header: "Alerta Salud", key: "alerta_alerta_salud" },
    { header: "Catálogo Patógeno", key: "catpato_catalogo_patogeno" },
    { header: "Usuario", key: "usu_usuario" },
];

const CAMPOS: CampoFormulario[] = [
    {
        key: "analab_laboratorio_nombre",
        label: "Laboratorio",
        tipo: "text",
        placeholder: "Ej: Laboratorio Central",
        requerido: true,
    },
    {
        key: "analab_fecha_envio",
        label: "Fecha envío",
        tipo: "text",
        placeholder: "Ej: 2026-03-19",
        requerido: true,
    },
    {
        key: "analab_fecha_resultado",
        label: "Fecha resultado",
        tipo: "text",
        placeholder: "Ej: 2026-03-21",
    },
    {
        key: "analab_resultado_tipo",
        label: "Resultado",
        tipo: "text",
        placeholder: "Ej: Positivo",
    },
    {
        key: "alert_alerta_salud",
        label: "Alerta Salud",
        tipo: "text",
        placeholder: "Ej: 1",
        requerido: true,
    },
    {
        key: "catpato_catalogo_patogeno",
        label: "Catálogo Patógeno",
        tipo: "text",
        placeholder: "Ej: 1",
    },
    {
        key: "usu_usuario",
        label: "Usuario",
        tipo: "text",
        placeholder: "Ej: 1",
    },
];

const AgroAnalisisLaboratorioPage = () => {
    const {
        analisisFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        abrirCrear, abrirEditar, cerrarModal, handleGuardar, handleEliminar,
    } = useAgroAnalisisLaboratorio();

    return (
        <CrudTabla
            titulo="Análisis de Laboratorio"
            subtitulo="AGRO_ANALISIS_LABORATORIO"
            icono={FlaskConical}
            columnas={COLUMNAS}
            datos={analisisFiltrados}
            idKey="analab_analisis_laboratorio"
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
        />
    );
};

export default AgroAnalisisLaboratorioPage;