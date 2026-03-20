export type AgroFinca = {
    fin_finca: number;
    fin_nombre: string;
    fin_ubicacion?: string;
    fin_hectarea?: number;
    usu_usuario: number;
    fin_activo?: number;
} & Record<string, unknown>;