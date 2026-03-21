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

