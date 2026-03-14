// ============================================================
// agroRol.types.ts
// Define las interfaces, constantes y valores iniciales
// que usa toda la feature de AgroRol.
// ============================================================

// ------------------------------------------------------------
// Rol — representa un registro de la tabla AGRO_ROL
// ------------------------------------------------------------
// [key: string]: unknown  →  "index signature"
// Necesario para que TypeScript acepte esta interfaz donde
// se espera Record<string, unknown> (como en CrudTabla genérico).
// Sin esta línea, TS se queja porque Rol tiene campos fijos
// y Record espera acceso dinámico por cualquier string.
export interface Rol {
    [key: string]: unknown;
    rol_rol:         number;   // PK — asignado por trigger Oracle
    rol_nombre:      string;
    rol_descripcion: string;
    rol_permiso:     number;   // 1=Operario 2=Supervisor 3=Agrónomo 4=Admin
    rol_activo:      number;   // 1=activo 0=inactivo (borrado lógico)
}

// ------------------------------------------------------------
// RolFormData — datos que maneja el formulario del modal
// ------------------------------------------------------------
// Todos los campos son string porque los inputs HTML
// siempre devuelven strings. La conversión a number se
// hace en el hook antes de llamar a la API.
// [key: string]: unknown → mismo motivo que Rol arriba.
export interface RolFormData {
    [key: string]: unknown;
    rol_nombre:      string;
    rol_descripcion: string;
    rol_permiso:     string;   // string aquí, Number() en el hook
}

// ------------------------------------------------------------
// ModalProps — props del modal de crear/editar
// (ya no se usa directamente — el modal está en CrudTabla)
// Se mantiene por compatibilidad si alguien lo referencia.
// ------------------------------------------------------------
export interface ModalProps {
    editando:  Rol | null;       // null = modo crear, Rol = modo editar
    form:      RolFormData;
    setForm:   (f: RolFormData) => void;
    guardando: boolean;
    formError: string;
    onGuardar: () => void;
    onCerrar:  () => void;
}

// ------------------------------------------------------------
// ROL_FORM_INICIAL — estado vacío del formulario
// Se usa en abrirCrear() para resetear el modal.
// ------------------------------------------------------------
export const ROL_FORM_INICIAL: RolFormData = {
    rol_nombre:      "",
    rol_descripcion: "",
    rol_permiso:     "",
};

// ------------------------------------------------------------
// NIVEL_PERMISO — mapa de estilos para los badges de nivel
// Clave: número de permiso (1-4)
// Valor: { label, bg, text } para pintar el badge en la tabla
// ------------------------------------------------------------
export const NIVEL_PERMISO: Record<number, { label: string; bg: string; text: string }> = {
    1: { label: "Operario",   bg: "#e8f0e0", text: "#4a7c59" },
    2: { label: "Supervisor", bg: "#ddeef8", text: "#2563a0" },
    3: { label: "Agrónomo",   bg: "#e8f5e0", text: "#2d6a2d" },
    4: { label: "Admin",      bg: "#fde8e0", text: "#a03020" },
};