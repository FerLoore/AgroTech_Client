// ============================================================
// AgroRolPage.tsx
// Página de gestión de roles. Es SOLO configuración:
// define columnas, campos del form, y conecta el hook con
// el componente visual genérico CrudTabla.
// No tiene lógica ni estilos propios.
// ============================================================

import { ShieldCheck } from "lucide-react";
import { useAgroRol } from "./useAgroRol";
import { NIVEL_PERMISO } from "./agroRol.types";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

// ------------------------------------------------------------
// COLUMNAS — define qué campos mostrar en la tabla y cómo.
// Cada objeto es una columna:
//   header: texto del encabezado
//   key:    nombre del campo en el objeto Rol (debe coincidir exactamente)
//   badge:  opcional — si existe, la celda se renderiza como badge de color
//           en lugar de texto plano.
//
// Object.fromEntries + Object.entries convierte NIVEL_PERMISO
// de { 1: {label,bg,text}, 2: ... } al formato que espera CrudTabla.
// ------------------------------------------------------------
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
        // Resultado: { "1": {label:"Operario",...}, "2": {...}, ... }
        // CrudTabla lo usa para saber qué badge pintar según el valor de rol_permiso
    },
];

// ------------------------------------------------------------
// CAMPOS — define los inputs del modal de crear/editar.
// Cada objeto es un campo del formulario:
//   key:         nombre del campo en RolFormData (debe coincidir)
//   label:       texto que aparece encima del input
//   tipo:        "text" | "number" | "select" | "textarea"
//   placeholder: texto de ayuda dentro del input
//   requerido:   marca visual (la validación real está en el hook)
//   opciones:    solo para tipo "select" — lista de {valor, label}
// ------------------------------------------------------------
const CAMPOS: CampoFormulario[] = [
    {
        key:         "rol_nombre",
        label:       "Nombre",
        tipo:        "text",
        placeholder: "Ej: Auditor",
        requerido:   true
    },
    {
        key:         "rol_descripcion",
        label:       "Descripción",
        tipo:        "text",
        placeholder: "Descripción opcional"
    },
    {
        key:       "rol_permiso",
        label:     "Nivel de Permiso",
        tipo:      "select",
        requerido: true,
        opciones: [
            { valor: "1", label: "1 — Operario"   },
            { valor: "2", label: "2 — Supervisor" },
            { valor: "3", label: "3 — Agrónomo"   },
            { valor: "4", label: "4 — Admin"      },
        ]
    },
];

// ------------------------------------------------------------
// AgroRolPage — componente de página
// Solo obtiene estado del hook y lo pasa al componente visual.
// No renderiza nada propio — CrudTabla hace todo el trabajo.
//
// setForm as (f: Record<string, unknown>) => void
//   → cast necesario porque el hook usa RolFormData (tipado
//     específico) y CrudTabla usa Record<string, unknown>
//     (tipado genérico). Son compatibles en runtime pero
//     TypeScript necesita el cast explícito.
// ------------------------------------------------------------
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
            idKey="rol_rol"              // campo PK para key de React en las filas
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