export interface AnalisisLaboratorio {
    [key: string]: unknown;
    analab_analisis_laboratorio: number;
    analab_laboratorio_nombre: string;
    analab_fecha_envio: string;
    analab_fecha_resultado?: string;
    analab_resultado_tipo?: string;
    alerta_alerta_salud: number;
    catpato_catalogo_patogeno?: number;
    usu_usuario?: number;
}

export interface AnalisisLaboratorioFormData {
    [key: string]: unknown;
    analab_laboratorio_nombre: string;
    analab_fecha_envio: string;
    analab_fecha_resultado: string;
    analab_resultado_tipo: string;
    alerta_alerta_salud: number;
    catpato_catalogo_patogeno: number;
    usu_usuario: number;
}

export const ANALISIS_LABORATORIO_FORM_INICIAL: AnalisisLaboratorioFormData = {
    analab_laboratorio_nombre: "",
    analab_fecha_envio: "",
    analab_fecha_resultado: "",
    analab_resultado_tipo: "",
    alerta_alerta_salud: 0,
    catpato_catalogo_patogeno: 0,
    usu_usuario: 0,
};