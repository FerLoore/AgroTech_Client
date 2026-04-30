// Contrato de datos para el Sistema de Reportes Modular AgroTech

export interface ClimaticData {
    humedad: number;
    temperatura: number;
    riesgoRoya: string;
}

export interface StatsData {
    totalArboles: number;
    enProduccion: number;
    enCrecimiento: number;
    enfermos: number;
    muertos: number;
}

export interface MaintenanceData {
    proximosRiegos: number;
    alertasActivas: number;
    tratamientosPendientes: number;
}

export interface AgroReportData {
    fincaNombre: string;
    seccionNombre: string;
    fechaReporte: string;
    stats: StatsData;
    clima: ClimaticData;
    mantenimiento: MaintenanceData;
}
