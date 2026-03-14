// ============================================================
// agroTipoArbol.types.ts
// ============================================================

export interface TipoArbol {
    [key: string]: unknown;
    tipar_tipo_arbol:        number;
    tipar_nombre_comun:      string;
    tipar_nombre_cientifico: string;
    tipar_anios_produccion:  number;
    tipar_descripcion:       string;
}

export interface TipoArbolFormData {
    [key: string]: unknown;
    tipar_nombre_comun:      string;
    tipar_nombre_cientifico: string;
    tipar_anios_produccion:  string; // string porque viene de input
    tipar_descripcion:       string;
}

export const TIPO_ARBOL_FORM_INICIAL: TipoArbolFormData = {
    tipar_nombre_comun:      "",
    tipar_nombre_cientifico: "",
    tipar_anios_produccion:  "",
    tipar_descripcion:       "",
};