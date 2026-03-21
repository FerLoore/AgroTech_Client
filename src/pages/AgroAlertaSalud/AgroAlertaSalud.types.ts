export interface AlertaSalud {
    [key: string]: unknown;
    alertsalud_id: number;
    alertsalud_fecha_deteccion: string;
    alertsalud_descripcion_sintoma?: string;
    alertsalud_foto?: string;
    arb_arbol: number;
    usu_usuario: number;
}

export interface AlertaSaludFormData {
    [key: string]: unknown;
    alertsalud_fecha_deteccion: string;
    alertsalud_descripcion_sintoma: string;
    alertsalud_foto: string;
    arb_arbol: number;
    usu_usuario: number;
}

export const ALERTA_SALUD_FORM_INICIAL: AlertaSaludFormData = {
    alertsalud_fecha_deteccion: "",
    alertsalud_descripcion_sintoma: "",
    alertsalud_foto: "",
    arb_arbol: 0,
    usu_usuario: 0,
};