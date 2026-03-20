export type AgroSeccion = {
    secc_seccion: number;
    secc_nombre: string;
    secc_tipo_suelo: string;
    fin_finca: number; // La llave foránea que la une a la finca
    secc_activo?: number;
} & Record<string, unknown>;