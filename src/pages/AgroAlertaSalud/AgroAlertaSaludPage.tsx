import { TriangleAlert } from "lucide-react";
import { useAgroAlertaSalud } from "./UseAgroAlertaSalud";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

const COLUMNAS: ColumnaConfig[] = [
    { header: "ID", key: "alertsalud_id" },
    { header: "Fecha detección", key: "fecha_deteccion" },
    { header: "Descripción síntoma", key: "descripcion_sintoma" },
    { header: "Foto", key: "foto" },
    { header: "Árbol", key: "arb_arbol" },
    { header: "Usuario", key: "usu_usuario" },
];

const CAMPOS = (opcionesArboles: CampoFormulario["opciones"], opcionesUsuarios: CampoFormulario["opciones"]): CampoFormulario[] => [
    {
        key: "alertsalud_fecha_deteccion",
        label: "Fecha de detección",
        tipo: "date",
        requerido: true,
    },
    {
        key: "alertsalud_descripcion_sintoma",
        label: "Descripción del síntoma",
        tipo: "text",
        placeholder: "Ej: Hojas con manchas",
    },
    {
        key: "alertsalud_foto",
        label: "Foto",
        tipo: "text",
        placeholder: "Ej: foto.jpg",
    },
    {
        key: "arb_arbol",
        label: "Árbol",
        tipo: "select",
        requerido: true,
        opciones: opcionesArboles,
    },
    {
        key: "usu_usuario",
        label: "Usuario",
        tipo: "select",
        requerido: true,
        opciones: opcionesUsuarios,
    },
];

const AgroAlertaSaludPage = () => {
    const {
        alertasFiltradas,
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
        opcionesArboles,
        opcionesUsuarios,
    } = useAgroAlertaSalud();

    return (
        <CrudTabla
            titulo="Alertas de Salud"
            subtitulo="AGRO_ALERTA_SALUD"
            icono={TriangleAlert}
            columnas={COLUMNAS}
            datos={alertasFiltradas}
            idKey="alertsalud_id"
            campos={CAMPOS(opcionesArboles, opcionesUsuarios)}
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

export default AgroAlertaSaludPage;