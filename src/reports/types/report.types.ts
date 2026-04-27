// src/reports/types/report.types.ts

export interface SeccionReportStat {
    seccion_id: number;
    nombre: string;
    total: number;
    enfermos: number;
    incidencia: number;
}

export interface AgroReportData {
    finca: {
        id: number;
        nombre: string;
        ubicacion: string;
    };
    fecha: string;
    autor: string;
    
    // Módulo Espacial (Tú)
    mapa: {
        snapshot: string; // Base64 de la captura del mapa
        stats: SeccionReportStat[];
        modo: "Choropleth" | "Heatmap";
    };

    // Estos campos serán llenados por tus compañeros más adelante
    estadisticas?: any; 
    mantenimiento?: any;
    prediccion?: any;
}
