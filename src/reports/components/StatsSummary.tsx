import type { StatsData } from "../types/report.types";

interface Props {
    data: StatsData;
}

export default function StatsSummary({ data }: Props) {
    const { totalArboles, enProduccion, enCrecimiento, enfermos, muertos } = data;
    
    return (
        <div style={{ marginTop: 24 }}>
            <h3 style={{ color: "#4a7c59", margin: "0 0 12px 0", fontSize: 18, borderBottom: "1px solid #e0e0e0", paddingBottom: 6 }}>
                Resumen de Inventario
            </h3>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[
                    { label: "Total", val: totalArboles, color: "#2d4a2d" },
                    { label: "Producción", val: enProduccion, color: "#4a7c59" },
                    { label: "Crecimiento", val: enCrecimiento, color: "#e67e22" },
                    { label: "Enfermos", val: enfermos, color: "#c0392b" },
                    { label: "Muertos", val: muertos, color: "#7a9a7a" },
                ].map(s => (
                    <div key={s.label} style={{
                        background: "#fff", borderRadius: 8, padding: "12px",
                        border: "1px solid #e8e0d0", textAlign: "center", minWidth: 90, flex: 1
                    }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: 12, color: "#7a9a7a", marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>
            
            {/* Gráfica estática para PDF (sin animaciones) */}
            <div style={{ marginTop: 20, height: 24, display: "flex", borderRadius: 12, overflow: "hidden", background: "#f0ece4" }}>
                {totalArboles > 0 && (
                    <>
                        <div style={{ width: `${(enProduccion / totalArboles) * 100}%`, background: "#4a7c59" }} title="Producción" />
                        <div style={{ width: `${(enCrecimiento / totalArboles) * 100}%`, background: "#e67e22" }} title="Crecimiento" />
                        <div style={{ width: `${(enfermos / totalArboles) * 100}%`, background: "#c0392b" }} title="Enfermos" />
                        <div style={{ width: `${(muertos / totalArboles) * 100}%`, background: "#7a9a7a" }} title="Muertos" />
                    </>
                )}
            </div>
        </div>
    );
}
