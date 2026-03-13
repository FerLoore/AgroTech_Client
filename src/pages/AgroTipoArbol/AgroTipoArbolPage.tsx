// ============================================================
// AgroTipoArbolPage.tsx
// ============================================================

import { TreeDeciduous } from "lucide-react";
import { useAgroTipoArbol } from "./UseAgroTipoArbol";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

// ── Columnas de la tabla ──────────────────────────────────────
const COLUMNAS: ColumnaConfig[] = [
    { header: "ID",               key: "tipar_tipo_arbol"        },
    { header: "Nombre Común",     key: "tipar_nombre_comun"       },
    { header: "Nombre Científico",key: "tipar_nombre_cientifico"  },
    { header: "Años Producción",  key: "tipar_anios_produccion"   },
    { header: "Descripción",      key: "tipar_descripcion"        },
];

// ── Campos del formulario ─────────────────────────────────────
const CAMPOS: CampoFormulario[] = [
    {
        key:         "tipar_nombre_comun",
        label:       "Nombre Común",
        tipo:        "text",
        placeholder: "Ej: Mango",
        requerido:   true,
    },
    {
        key:         "tipar_nombre_cientifico",
        label:       "Nombre Científico",
        tipo:        "text",
        placeholder: "Ej: Mangifera indica",
    },
    {
        key:         "tipar_anios_produccion",
        label:       "Años de Producción",
        tipo:        "number",
        placeholder: "Ej: 8 (default)",
    },
    {
        key:         "tipar_descripcion",
        label:       "Descripción",
        tipo:        "textarea",
        placeholder: "Descripción opcional del tipo de árbol",
    },
];

// ── Página ────────────────────────────────────────────────────
const AgroTipoArbolPage = () => {
    const {
        tipoArbolesFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        abrirCrear, abrirEditar, cerrarModal, handleGuardar, handleEliminar,
    } = useAgroTipoArbol();

    return (
        <CrudTabla
            titulo="Tipos de Árbol"
            subtitulo="AGRO_TIPO_ARBOL"
            icono={TreeDeciduous}
            columnas={COLUMNAS}
            datos={tipoArbolesFiltrados}
            idKey="tipar_tipo_arbol"
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

export default AgroTipoArbolPage;