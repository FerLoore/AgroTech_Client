export interface Surco {
    [key: string]: unknown;

    sur_surco: number;
    sur_numero_surco: number;
    sur_orientacion: string;
    sur_espaciamiento: number;
    secc_secciones: number;
    sur_activo: number;
}

export interface SurcoFormData {
    [key: string]: unknown;

    sur_numero_surco: string;
    sur_orientacion: string;
    sur_espaciamiento: string;
    secc_secciones: string;
}

export const SURCO_FORM_INICIAL: SurcoFormData = {
    sur_numero_surco: "",
    sur_orientacion: "",
    sur_espaciamiento: "",
    secc_secciones: ""
};