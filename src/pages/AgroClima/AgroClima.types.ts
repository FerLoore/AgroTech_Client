export type AgroClima = {
    clim_clima: number;
    clim_fecha?: string;
    clim_temperatura: number;
    clim_humedad_relativa: number;
    clim_precipitacion: number;
    seccionId?: number; 
} & Record<string, unknown>;