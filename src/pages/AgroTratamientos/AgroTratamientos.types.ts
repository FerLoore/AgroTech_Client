export interface Tratamiento {
    [key: string]: any;
    trata_tratamientos: number; // Coincide con @PrimaryColumn
    trata_fecha_inicio: string;
    trata_fecha_fin?: string;
    trata_estado: string;
    trata_dosis?: string;
    trata_observaciones?: string;
    alertsalu_alerta_salud: number;
    produ_producto: number;
}

export interface TratamientoFormData {
    [key: string]: any;
    trata_fecha_inicio: string;
    trata_fecha_fin?: string;
    trata_dosis: string;
    trata_observaciones: string;
    alertsalu_alerta_salud: number;
    produ_producto: number;
    trata_cantidad?: number; 
}

export const TRATAMIENTO_FORM_INICIAL: TratamientoFormData = {
    trata_fecha_inicio: "",
    trata_fecha_fin: "",
    trata_estado: "En curso",
    trata_dosis: "",
    trata_observaciones: "",
    alertsalu_alerta_salud: 0,
    produ_producto: 0,
    trata_cantidad: 0,
};