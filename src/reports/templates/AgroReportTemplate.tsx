import React from 'react';
import type { AgroReportData } from '../types/report.types';
import StatsSummary from '../components/StatsSummary';
import MaintenanceKPIs from '../components/MaintenanceKPIs';
import ClimateAlert from '../components/ClimateAlert';

interface Props {
    data: AgroReportData;
}

// Para usar html2pdf, React.forwardRef es ideal
export const AgroReportTemplate = React.forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
    return (
        <div ref={ref} style={{ 
            width: "800px", 
            padding: "40px 50px", 
            background: "#ffffff",
            fontFamily: "'Inter', 'Roboto', sans-serif",
            color: "#333",
            boxSizing: "border-box"
        }}>
            {/* Encabezado */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2px solid #4a7c59", paddingBottom: 16 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28, color: "#4a7c59", fontWeight: 800 }}>AgroTech</h1>
                    <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#7a9a7a" }}>Reporte Dinámico de Estado</p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#2d4a2d" }}>{data.fincaNombre}</div>
                    <div style={{ fontSize: 14, color: "#7a9a7a" }}>Sección: {data.seccionNombre}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Generado: {data.fechaReporte}</div>
                </div>
            </div>

            {/* Contenido Modular */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <StatsSummary data={data.stats} />
                <MaintenanceKPIs data={data.mantenimiento} />
                <ClimateAlert data={data.clima} />
            </div>

            {/* Pie de página */}
            <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #e0e0e0", textAlign: "center", fontSize: 11, color: "#aaa" }}>
                Generado por el Sistema de Reportes Modular AgroTech. Documento confidencial.
            </div>
        </div>
    );
});
