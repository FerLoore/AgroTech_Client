import { ShieldCheck } from "lucide-react";
import { useAgroRol } from "./useAgroRol";
import { NIVEL_PERMISO } from "./agroRol.types";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

// ── Configuración de columnas ─────────────────────────────────
const COLUMNAS: ColumnaConfig[] = [
    { header: "ID",          key: "rol_rol"         },
    { header: "Nombre",      key: "rol_nombre"       },
    { header: "Descripción", key: "rol_descripcion"  },
    {
        header: "Nivel",
        key:    "rol_permiso",
        badge:  Object.fromEntries(
            Object.entries(NIVEL_PERMISO).map(([k, v]) => [k, { label: v.label, bg: v.bg, text: v.text }])
        )
    },
];

// ── Configuración del formulario ──────────────────────────────
const CAMPOS: CampoFormulario[] = [
    { key: "rol_nombre",      label: "Nombre",          tipo: "text",   placeholder: "Ej: Auditor",           requerido: true  },
    { key: "rol_descripcion", label: "Descripción",     tipo: "text",   placeholder: "Descripción opcional"                    },
    {
        key:      "rol_permiso",
        label:    "Nivel de Permiso",
        tipo:     "select",
        requerido: true,
        opciones: [
            { valor: "1", label: "1 — Operario"   },
            { valor: "2", label: "2 — Supervisor" },
            { valor: "3", label: "3 — Agrónomo"   },
            { valor: "4", label: "4 — Admin"      },
        ]
    },
];

// ── Página ────────────────────────────────────────────────────
const AgroRolPage = () => {
    const {
        rolesFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        abrirCrear, abrirEditar, cerrarModal, handleGuardar, handleEliminar,
    } = useAgroRol();

    return (
        <CrudTabla
            titulo="Gestión de Roles"
            subtitulo="AGRO_ROL"
            icono={ShieldCheck}
            columnas={COLUMNAS}
            datos={rolesFiltrados}
            idKey="rol_rol"
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

export default AgroRolPage;