// src/reports/types/report.types.ts

export interface SeccionReportStat {
    seccion_id: number;
    nombre: string;
    total: number;
    enfermos: number;
    incidencia: number;
}

// ── Árbol en estado sospechoso (Crecimiento que superó años esperados) ────────
export interface ArbolSospechoso {
    arbol_id: number;
    referencia: string;       // "S3-P7"
    seccion: string;
    surco: number;
    variedad: string;
    fecha_siembra: string;    // ISO string
    anios_transcurridos: number;
    anios_esperados: number;
    exceso_anios: number;     // anios_transcurridos - anios_esperados
}

export interface StatsSummaryData {
    totalArboles: number;
    totalSurcos: number;
    totalSecciones: number;
    arbolesEnfermos: number;
    arbolesEnAlerta: number;
    distribucionEstados: { estado: string; cantidad: number }[];
    surcosCriticos: { nombre: string; total: number; enfermos: number; alertas: number }[];
    arbolesSOspechosos?: ArbolSospechoso[];  // lista detallada para la tabla del PDF
}

// ── Top 10 árboles con más alertas ──────────────────────────────────────────
export interface ArbolTopAlerta {
    arbol_id: number;
    referencia: string;
    seccion: string;
    surco: number;
    totalAlertas: number;
    estado: string;
}

// ── Frecuencia de síntomas (dona) ────────────────────────────────────────────
export interface FrecuenciaEnfermedad {
    nombre: string;    // Texto del síntoma
    cantidad: number;
}

// ── Contenedor de ambos gráficos ─────────────────────────────────────────────
export interface ChartsData {
    top10Arboles: ArbolTopAlerta[];
    frecuenciaEnfermedades: FrecuenciaEnfermedad[];
}

export interface AgroReportData {
    finca: {
        id: number;
        nombre: string;
        ubicacion: string;
    };
    fecha: string;
    autor: string;

    mapa: {
        snapshot: string;
        stats: SeccionReportStat[];
        modo: "Choropleth" | "Heatmap";
    };

    estadisticas?: StatsSummaryData;

    charts?: ChartsData;

    mantenimiento?: any;
    prediccion?: any;
}