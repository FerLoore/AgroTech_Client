export type AgroClima = {
    clim_clima: number;
    clim_fecha?: string;
    clim_temperatura: number;
    clim_humedad_relativa: number;
    clim_precipitacion: number;
    secc_seccion?: number;
    secc_nombre?: string;
    seccionId?: number; 
} & Record<string, unknown>;