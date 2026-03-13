import { Bug } from "lucide-react";
import { useAgroCatalogoPatogeno } from "./UseAgroCatalogoPatogeno";
import { TIPO_PATOGENO, GRAVEDAD_PATOGENO } from "./AgroCatalogoPatogeno.types";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

const COLUMNAS: ColumnaConfig[] = [
    { header: "ID",               key: "catpato_catalogo_patogeno" },
    { header: "Nombre Común",     key: "catpato_nombre_comun"      },
    { header: "Nombre Científico",key: "catpato_nombre_cientifico" },
    {
        header: "Tipo",
        key:    "catpato_tipo",
        badge:  Object.fromEntries(
            Object.entries(TIPO_PATOGENO).map(([k, v]) => [k, { label: v.label, bg: v.bg, text: v.text }])
        )
    },
    {
        header: "Gravedad",
        key:    "catpato_gravedad",
        badge:  Object.fromEntries(
            Object.entries(GRAVEDAD_PATOGENO).map(([k, v]) => [k, { label: v.label, bg: v.bg, text: v.text }])
        )
    },
];

const CAMPOS: CampoFormulario[] = [
    {
        key:         "catpato_nombre_comun",
        label:       "Nombre Común",
        tipo:        "text",
        placeholder: "Ej: Oídio",
        requerido:   true,
    },
    {
        key:         "catpato_nombre_cientifico",
        label:       "Nombre Científico",
        tipo:        "text",
        placeholder: "Ej: Podosphaera xanthii",
    },
    {
        key:       "catpato_tipo",
        label:     "Tipo",
        tipo:      "select",
        requerido: true,
        opciones: [
            { valor: "Hongo",    label: "Hongo"    },
            { valor: "Bacteria", label: "Bacteria" },
            { valor: "Plaga",    label: "Plaga"    },
        ]
    },
    {
        key:       "catpato_gravedad",
        label:     "Gravedad",
        tipo:      "select",
        requerido: true,
        opciones: [
            { valor: "1", label: "1 — Leve"     },
            { valor: "2", label: "2 — Moderado" },
            { valor: "3", label: "3 — Grave"    },
        ]
    },
];

const AgroCatalogoPatogenoPage = () => {
    const {
        patogenosFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        abrirCrear, abrirEditar, cerrarModal, handleGuardar, handleEliminar,
    } = useAgroCatalogoPatogeno();

    return (
        <CrudTabla
            titulo="Catálogo de Patógenos"
            subtitulo="AGRO_CATALOGO_PATOGENO"
            icono={Bug}
            columnas={COLUMNAS}
            datos={patogenosFiltrados}
            idKey="catpato_catalogo_patogeno"
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

export default AgroCatalogoPatogenoPage;