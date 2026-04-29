export type AgroSeccion = {
    secc_seccion: number;
    secc_nombre: string;
    secc_tipo_suelo: string;
    fin_finca: number;
    fin_nombre?: string; // Nombre de finca desde el join
    secc_activo?: number;
} & Record<string, unknown>;