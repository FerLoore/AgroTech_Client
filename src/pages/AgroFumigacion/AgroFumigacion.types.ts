export interface Fumigacion {
    [key: string]: unknown;
    fumi_fumigacion:       number;
    fumi_seccion:          number;
    fumi_producto:         number;
    fumi_fecha_programada: string;
    fumi_dosis:            string;
    fumi_estado:           "Pendiente" | "Realizado" | "Cancelado";
}

export interface FumigacionFormData {
    [key: string]: unknown;
    fumi_seccion:          number | string;
    fumi_producto:         number | string;
    fumi_fecha_programada: string;
    fumi_dosis:            string;
}

// Valores por defecto al darle click al botón "Nuevo"
export const FUMIGACION_FORM_INICIAL: FumigacionFormData = {
    fumi_seccion:          "",
    fumi_producto:         "",
    fumi_fecha_programada: "",
    fumi_dosis:            "",
};