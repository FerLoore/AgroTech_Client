import { Ruler } from "lucide-react";
import { useAgroSurco } from "./useAgroSurco";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

const COLUMNAS: ColumnaConfig[] = [
    { header: "ID", key: "sur_surco" },
    { header: "Número", key: "sur_numero_surco" },
    { header: "Orientación", key: "sur_orientacion" },
    { header: "Espaciamiento", key: "sur_espaciamiento" },
    { header: "Sección", key: "secc_secciones" }
];


const AgroSurcoPage = () => {

    const {
        surcosFiltrados,
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
        opcionesSecciones
    } = useAgroSurco();

const CAMPOS: CampoFormulario[] = [
    { key: "sur_numero_surco", label: "Número", tipo: "number", requerido: true },
    { key: "sur_orientacion", label: "Orientación", tipo: "text" },
    { key: "sur_espaciamiento", label: "Espaciamiento", tipo: "number", requerido: true },
    {
        key: "secc_secciones",
        label: "Sección",
        tipo: "select",
        requerido: true,
        opciones: opcionesSecciones 
    }
];


    return (
        <CrudTabla
            titulo="Gestión de Surcos"
            subtitulo="AGRO_SURCO"
            icono={Ruler}
            columnas={COLUMNAS}
            datos={surcosFiltrados}
            idKey="sur_surco"
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

export default AgroSurcoPage;