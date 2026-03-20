export type AgroUsuario = {
    usu_usuario: number;
    usu_nombre: string;
    rol_rol: number;
    usu_especialidad?: string;
    usu_activo?: number;
} & Record<string, unknown>; 