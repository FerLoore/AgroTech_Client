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
    seccion_id?: number;
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
    referencia: string;
    lat: number;
    lng: number;
    estado_sospechoso?: boolean;
    anios_produccion?: number;  // tipar_anios_produccion del tipo de árbol (viene del backend)
}

export interface SeccionStats {
    seccion_id: number;
    nombre: string;
    total: number;
    enfermos: number;
    incidencia: number;
}

export interface MapaFincaResponse {
    ok: boolean;
    finca: Finca;
    perimetro: PuntoPerimetro[];
    arboles: ArbolMapa[];
    secciones_stats: SeccionStats[];
}

// Colores por estado — usados en CircleMarker
export const COLORES_ESTADO: Record<string, string> = {
    Produccion: "#185FA5",
    Crecimiento: "#4a7c59",
    Enfermo: "#c0392b",
    Muerto: "#333333",
    Cuarentena: "#c0392b",
};

// Zoom fallback (el AutoFit lo sobreescribe automáticamente)
export const ZOOM_INICIAL = 19;