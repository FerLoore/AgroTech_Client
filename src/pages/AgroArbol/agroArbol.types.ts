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
    Crecimiento: { label: "Crecimiento", bg: "#EAF3DE", text: "#4a7c59" },
    Produccion:  { label: "Producción",  bg: "#E6F1FB", text: "#185FA5" },
    Enfermo:     { label: "Enfermo",     bg: "#FAEEDA", text: "#c0392b" },
    Muerto:      { label: "Muerto",      bg: "#FCEBEB", text: "#333333" },
    Cuarentena:  { label: "Cuarentena",  bg: "#FAEEDA", text: "#c0392b" },
} as const;

