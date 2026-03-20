// ============================================================
// agroHistorial.types.ts
// Define interfaces, form y valores iniciales
// ============================================================

// ------------------------------------------------------------
// Historial — representa un registro de AGRO_HISTORIAL
// ------------------------------------------------------------
export interface Historial {
    [key: string]: unknown;

    histo_historial:       number;
    histo_estado_anterior: string;
    histo_estado_nuevo:    string;
    histo_fecha_cambio:    string; // timestamp → string para frontend
    arb_arbol:             number;
    histo_motivo:          string;
    usu_usuario:           number;
}

// ------------------------------------------------------------
// HistorialFormData — (aunque NO lo uses mucho)
// Se mantiene por consistencia con CrudTabla
// ------------------------------------------------------------
export interface HistorialFormData {
    [key: string]: unknown;

    histo_estado_anterior: string;
    histo_estado_nuevo:    string;
    histo_fecha_cambio:    string;
    arb_arbol:             string;
    histo_motivo:          string;
    usu_usuario:           string;
}

// ------------------------------------------------------------
// FORM INICIAL
// ------------------------------------------------------------
export const HISTORIAL_FORM_INICIAL: HistorialFormData = {
    histo_estado_anterior: "",
    histo_estado_nuevo:    "",
    histo_fecha_cambio:    "",
    arb_arbol:             "",
    histo_motivo:          "",
    usu_usuario:           "",
};