import type { MaintenanceData } from "../types/report.types";

interface Props {
    data: MaintenanceData;
}

export default function MaintenanceKPIs({ data }: Props) {
    const { proximosRiegos, alertasActivas, tratamientosPendientes } = data;
    
    return (
        <div style={{ marginTop: 24 }}>
            <h3 style={{ color: "#4a7c59", margin: "0 0 12px 0", fontSize: 18, borderBottom: "1px solid #e0e0e0", paddingBottom: 6 }}>
                Indicadores de Mantenimiento
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <div style={{ background: "#fdf8ec", border: "1px solid #fce8b2", borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 14, color: "#b48c1e", fontWeight: 600 }}>Próximos Riegos</div>
                    <div style={{ fontSize: 28, color: "#d4a424", fontWeight: 700, marginTop: 4 }}>{proximosRiegos}</div>
                </div>
                <div style={{ background: "#fdf0ee", border: "1px solid #f5c4b3", borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 14, color: "#993c1d", fontWeight: 600 }}>Alertas de Salud Activas</div>
                    <div style={{ fontSize: 28, color: "#c0392b", fontWeight: 700, marginTop: 4 }}>{alertasActivas}</div>
                </div>
                <div style={{ background: "#eef5ee", border: "1px solid #c8d8c0", borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 14, color: "#4a7c59", fontWeight: 600 }}>Tratamientos Pendientes</div>
                    <div style={{ fontSize: 28, color: "#2d4a2d", fontWeight: 700, marginTop: 4 }}>{tratamientosPendientes}</div>
                </div>
            </div>
        </div>
    );
}
