export interface Arbol {
    [key: string]: unknown;

    arb_arbol: number;
    arb_posicion_surco: number;
    arb_fecha_siembra: string;
    tipar_tipo_arbol: number;
    arb_estado: string;
    sur_surcos: number;
    arb_activo: number;
}

export interface ArbolFormData {
    [key: string]: unknown;

    arb_posicion_surco: string;
    arb_fecha_siembra: string;
    tipar_tipo_arbol: string;
    arb_estado: string;
    sur_surcos: string;
}

export const ARBOL_FORM_INICIAL: ArbolFormData = {
    arb_posicion_surco: "",
    arb_fecha_siembra: "",
    tipar_tipo_arbol: "",
    arb_estado: "",
    sur_surcos: ""
};

export const TipoArbol = {
    Crecimiento: { label: "Crecimiento", bg: "#e8f0e0", text: "#4a7c59" },
    Produccion:  { label: "Producción",  bg: "#ddeef8", text: "#2563a0" },
    Enfermo:     { label: "Enfermo",     bg: "#fef3c7", text: "#b45309" },
    Muerto:      { label: "Muerto",      bg: "#f8d7da", text: "#721c24" }
} as const;

export const TIPOS_ARBOL = {
    1: { label: "Mango", bg: "#fff7e6", text: "#b45309" },
    2: { label: "Aguacate", bg: "#e6f4ea", text: "#166534" },
    3: { label: "Naranja", bg: "#fff1f2", text: "#ea580c" },
    4: { label: "Limón", bg: "#f0fdf4", text: "#65a30d" },
    5: { label: "Papaya", bg: "#fef3c7", text: "#d97706" }
} as const;