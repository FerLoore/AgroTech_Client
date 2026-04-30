import type { ClimaticData } from "../types/report.types";

interface Props {
    data: ClimaticData;
}

export default function ClimateAlert({ data }: Props) {
    const { humedad, temperatura, riesgoRoya } = data;
    
    return (
        <div style={{ marginTop: 24 }}>
            <h3 style={{ color: "#4a7c59", margin: "0 0 12px 0", fontSize: 18, borderBottom: "1px solid #e0e0e0", paddingBottom: 6 }}>
                Pronóstico y Clima
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 20, background: "#f8f9fa", padding: 16, borderRadius: 8, border: "1px solid #e9ecef" }}>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, color: "#495057", lineHeight: 1.6 }}>
                        Basado en las condiciones actuales, la temperatura media es de <strong>{temperatura}°C</strong> con una humedad relativa del <strong>{humedad}%</strong>. 
                        El riesgo de proliferación de enfermedades (como la Roya) se clasifica como <strong>{riesgoRoya}</strong>. 
                        Se recomienda ajustar los ciclos de riego y monitorear el follaje en la próxima semana.
                    </p>
                </div>
                <div style={{ minWidth: 120, borderLeft: "1px solid #dee2e6", paddingLeft: 20 }}>
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: "#868e96" }}>Temperatura</div>
                        <div style={{ fontSize: 20, color: "#343a40", fontWeight: 600 }}>{temperatura}°C</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: "#868e96" }}>Humedad</div>
                        <div style={{ fontSize: 20, color: "#343a40", fontWeight: 600 }}>{humedad}%</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
