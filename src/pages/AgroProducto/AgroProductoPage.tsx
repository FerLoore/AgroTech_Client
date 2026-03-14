import { Package } from "lucide-react";
import { useAgroProducto } from "./UseAgroProducto";
import { TIPO_PRODUCTO } from "./AgroProducto.types";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

const COLUMNAS: ColumnaConfig[] = [
    { header: "ID",            key: "produ_producto"     },
    { header: "Nombre",        key: "produ_nombre"       },
    {
        header: "Tipo",
        key:    "produ_tipo",
        badge:  Object.fromEntries(
            Object.entries(TIPO_PRODUCTO).map(([k, v]) => [k, { label: v.label, bg: v.bg, text: v.text }])
        )
    },
    { header: "Concentración", key: "produ_concentracion" },
    { header: "Unidad",        key: "produ_unidad"        },
];

const CAMPOS: CampoFormulario[] = [
    {
        key:         "produ_nombre",
        label:       "Nombre",
        tipo:        "text",
        placeholder: "Ej: Mancozeb 80%",
        requerido:   true,
    },
    {
        key:       "produ_tipo",
        label:     "Tipo",
        tipo:      "select",
        requerido: true,
        opciones: [
            { valor: "Fungicida",    label: "Fungicida"    },
            { valor: "Bactericida",  label: "Bactericida"  },
            { valor: "Insecticida",  label: "Insecticida"  },
            { valor: "Herbicida",    label: "Herbicida"    },
            { valor: "Fertilizante", label: "Fertilizante" },
        ]
    },
    {
        key:         "produ_concentracion",
        label:       "Concentración",
        tipo:        "text",
        placeholder: "Ej: 80%",
    },
    {
        key:         "produ_unidad",
        label:       "Unidad",
        tipo:        "text",
        placeholder: "Ej: kg, L, ml",
    },
];

const AgroProductoPage = () => {
    const {
        productosFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        abrirCrear, abrirEditar, cerrarModal, handleGuardar, handleEliminar,
    } = useAgroProducto();

    return (
        <CrudTabla
            titulo="Productos"
            subtitulo="AGRO_PRODUCTO"
            icono={Package}
            columnas={COLUMNAS}
            datos={productosFiltrados}
            idKey="produ_producto"
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

export default AgroProductoPage;