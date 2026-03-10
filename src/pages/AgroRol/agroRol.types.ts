export interface Rol {
    rol_rol:         number;
    rol_nombre:      string;
    rol_descripcion: string;
    rol_permiso:     number;
    rol_activo:      number;
}

export interface RolFormData {
    rol_rol:         string;
    rol_nombre:      string;
    rol_descripcion: string;
    rol_permiso:     string;
}

export interface ModalProps {
    editando:  Rol | null;
    form:      RolFormData;
    setForm:   (f: RolFormData) => void;
    guardando: boolean;
    formError: string;
    onGuardar: () => void;
    onCerrar:  () => void;
}

export const ROL_FORM_INICIAL: RolFormData = {
    rol_rol:         "",
    rol_nombre:      "",
    rol_descripcion: "",
    rol_permiso:     "",
};

export const NIVEL_PERMISO: Record<number, { label: string; bg: string; text: string }> = {
    1: { label: "Operario",   bg: "#e8f0e0", text: "#4a7c59" },
    2: { label: "Supervisor", bg: "#ddeef8", text: "#2563a0" },
    3: { label: "Agrónomo",   bg: "#e8f5e0", text: "#2d6a2d" },
    4: { label: "Admin",      bg: "#fde8e0", text: "#a03020" },
};