export interface Tratamiento {
    [key: string]: unknown;
    trata_tratamientos: number;
    trata_fecha_inicio: string;
    trata_fecha_fin?: string | null;
    trata_estado: string;
    trata_dosis?: string;
    trata_observaciones?: string;
    alertsalu_alerta_salud?: number | null;
    produ_producto: number;
    trata_tipo: string;
    secc_seccion?: number | null;
    trata_num_aplicaciones?: number | null;
}

export interface TratamientoFormData {
    [key: string]: unknown;
    trata_fecha_inicio: string;
    trata_fecha_fin: string;
    trata_estado: string;
    trata_dosis: string;
    trata_observaciones: string;
    alertsalu_alerta_salud: number | null;
    produ_producto: number;
    trata_tipo: string;
    secc_seccion: number | null;
    trata_num_aplicaciones: number | null;
}

export const TRATAMIENTO_FORM_INICIAL: TratamientoFormData = {
    trata_fecha_inicio: "",
    trata_fecha_fin: "",
    trata_estado: "",
    trata_dosis: "",
    trata_observaciones: "",
    alertsalu_alerta_salud: null,
    produ_producto: 0,
    trata_tipo: "Curativo",
    secc_seccion: null,
    trata_num_aplicaciones: null,
};