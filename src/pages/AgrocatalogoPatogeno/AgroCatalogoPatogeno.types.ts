export interface CatalogoPatogeno {
    [key: string]: unknown;
    catpato_catalogo_patogeno: number;
    catpato_nombre_comun:      string;
    catpato_nombre_cientifico: string;
    catpato_tipo:              string;   // "Hongo" | "Bacteria" | "Plaga"
    catpato_gravedad:          number;   // 1=Leve 2=Moderado 3=Grave
    catpato_activo:            number;
}

export interface CatalogoPatogenoFormData {
    [key: string]: unknown;
    catpato_nombre_comun:      string;
    catpato_nombre_cientifico: string;
    catpato_tipo:              string;
    catpato_gravedad:          string;
}

export const CATALOGO_PATOGENO_FORM_INICIAL: CatalogoPatogenoFormData = {
    catpato_nombre_comun:      "",
    catpato_nombre_cientifico: "",
    catpato_tipo:              "",
    catpato_gravedad:          "",
};

export const TIPO_PATOGENO: Record<string, { label: string; bg: string; text: string }> = {
    Hongo:    { label: "Hongo",    bg: "#f3e8ff", text: "#7c3aed" },
    Bacteria: { label: "Bacteria", bg: "#fef3c7", text: "#b45309" },
    Plaga:    { label: "Plaga",    bg: "#fde8e0", text: "#a03020" },
};

export const GRAVEDAD_PATOGENO: Record<number, { label: string; bg: string; text: string }> = {
    1: { label: "Leve",     bg: "#e8f0e0", text: "#4a7c59" },
    2: { label: "Moderado", bg: "#fef3c7", text: "#b45309" },
    3: { label: "Grave",    bg: "#fde8e0", text: "#a03020" },
};