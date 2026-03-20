import { TreePine } from "lucide-react";
import { useAgroArbol } from "./useAgroArbol";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";
import { TipoArbol } from "./agroArbol.types";

const COLUMNAS: ColumnaConfig[] = [
    { header: "ID", key: "arb_arbol" },
    { header: "Posición", key: "arb_posicion_surco" },
    { header: "Fecha Siembra", key: "arb_fecha_siembra" },
    {
        header: "Estado",
        key: "arb_estado",
        badge: TipoArbol
    },
    { header: "Surco", key: "sur_surcos" }
];

const CAMPOS: CampoFormulario[] = [
    { key: "arb_posicion_surco", label: "Posición", tipo: "number", requerido: true },
    { key: "arb_fecha_siembra", label: "Fecha Siembra", tipo: "date", requerido: true },
    { key: "tipar_tipo_arbol", label: "Tipo Árbol", tipo: "number", requerido: true },
    {
        key: "arb_estado",
        label: "Estado",
        tipo: "select",
        requerido: true,
        opciones:Object.entries(TipoArbol).map(([valor, config]) => ({
            valor,
            label: config.label
        }))
    },
    { key: "sur_surcos", label: "Surco", tipo: "number", requerido: true }
];


const AgroArbolPage = () => {

    const {
        arbolesFiltrados,
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
        handleEliminar
    } = useAgroArbol();

    return (
        <CrudTabla
            titulo="Gestión de Árboles"
            subtitulo="AGRO_ARBOL"
            icono={TreePine}
            columnas={COLUMNAS}
            datos={arbolesFiltrados}
            idKey="arb_arbol"
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

export default AgroArbolPage;