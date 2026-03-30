// ============================================================
// agroMapa.types.ts
// ============================================================

export interface Finca {
    fin_finca: number;
    fin_nombre: string;
    fin_ubicacion: string;
    fin_hectarea: number;
    fin_latitud_origen: number;
    fin_longitud_origen: number;
}

export interface PuntoPerimetro {
    orden: number;
    lat: number;
    lng: number;
}

export interface ArbolMapa {
    id: number;
    estado: "Produccion" | "Crecimiento" | "Enfermo" | "Muerto";
    posicion_surco: number;
    numero_surco: number;
    seccion_nombre: string;
    seccion_id: number;
    variedad: string;
    fecha_siembra: string;
    referencia: string;   // ej: "S1-P3"
    lat: number;
    lng: number;
}

export interface MapaFincaResponse {
    ok: boolean;
    finca: Finca;
    perimetro: PuntoPerimetro[];
    arboles: ArbolMapa[];
}

// Colores por estado — usados en CircleMarker
export const COLORES_ESTADO: Record<string, string> = {
    Produccion: "#4a7c59",
    Crecimiento: "#e67e22",
    Enfermo: "#c0392b",
    Muerto: "#888888",
};

// Zoom alto para ver árboles separados en 1 hectárea
export const ZOOM_INICIAL = 18;