
import React from "react";
import type { ChartsData, ArbolTopAlerta, FrecuenciaEnfermedad } from "../types/report.types";

const VERDE = "#4a7c59";
const GRIS = "#7a9a7a";
const BORDE = "#d4e4d4";
const ROJO = "#c0392b";
const NARANJA = "#e67e22";

const PALETA = [
    "#e67e22", "#c0392b", "#8e44ad", "#2980b9",
    "#16a085", "#d35400", "#27ae60", "#2c3e50",
    "#f39c12", "#1abc9c",
];

// ─── Gráfico de dona SVG ──────────────────────────────────────────────────────
const DonaChart: React.FC<{
    datos: (FrecuenciaEnfermedad & { color: string })[];
}> = ({ datos }) => {
    const total = datos.reduce((s, d) => s + d.cantidad, 0);

    if (total === 0) {
        return (
            <p style={{ fontSize: 13, color: GRIS, textAlign: "center", margin: "24px 0" }}>
                Sin síntomas registrados ✔
            </p>
        );
    }

    const CX = 90, CY = 90, REXT = 70, RINT = 36;
    const ANGULO_INICIO = -Math.PI / 2;

    const arcos = datos.reduce<(typeof datos[0] & { path: string; angStart: number; ang: number })[]>(
        (acc, d) => {
            const angStart = acc.length === 0 ? ANGULO_INICIO : acc[acc.length - 1].angStart + acc[acc.length - 1].ang;
            const ang = (d.cantidad / total) * 2 * Math.PI;
            const x1 = CX + REXT * Math.cos(angStart);
            const y1 = CY + REXT * Math.sin(angStart);
            const x2 = CX + REXT * Math.cos(angStart + ang);
            const y2 = CY + REXT * Math.sin(angStart + ang);
            const xi1 = CX + RINT * Math.cos(angStart);
            const yi1 = CY + RINT * Math.sin(angStart);
            const xi2 = CX + RINT * Math.cos(angStart + ang);
            const yi2 = CY + RINT * Math.sin(angStart + ang);
            const grande = ang > Math.PI ? 1 : 0;

            const path = [
                `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
                `A ${REXT} ${REXT} 0 ${grande} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
                `L ${xi2.toFixed(2)} ${yi2.toFixed(2)}`,
                `A ${RINT} ${RINT} 0 ${grande} 0 ${xi1.toFixed(2)} ${yi1.toFixed(2)}`,
                "Z",
            ].join(" ");

            return [...acc, { ...d, path, angStart, ang }];
        },
        []
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            {/* Dona */}
            <svg width={180} height={180} viewBox="0 0 180 180">
                {arcos.map((a, i) => (
                    <path key={i} d={a.path} fill={a.color} stroke="#fff" strokeWidth={2} />
                ))}
                <text x={CX} y={CY - 8} textAnchor="middle" fontSize={26} fontWeight={800} fill="#2d4a2d">{total}</text>
                <text x={CX} y={CY + 12} textAnchor="middle" fontSize={11} fill={GRIS}>alertas</text>
            </svg>

            {/* Leyenda debajo de la dona — sin solapamiento */}
            <div style={{ width: "100%" }}>
                {datos.map((d, i) => (
                    <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "4px 0", borderBottom: i < datos.length - 1 ? `1px solid #f0f4f0` : "none",
                    }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#333", flex: 1 }}>{d.nombre}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: d.color, flexShrink: 0 }}>
                            {Math.round((d.cantidad / total) * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Top 10 tabla limpia ──────────────────────────────────────────────────────
const Top10Tabla: React.FC<{ arboles: ArbolTopAlerta[] }> = ({ arboles }) => {
    if (arboles.length === 0) {
        return (
            <p style={{ fontSize: 13, color: GRIS, textAlign: "center", margin: "24px 0" }}>
                Sin árboles con alertas registradas ✔
            </p>
        );
    }

    const badgeColor = (estado: string) => {
        if (estado === "Enfermo") return { bg: "#fde8e8", fg: ROJO };
        if (estado === "Produccion") return { bg: "#e3f2fd", fg: "#1565c0" };
        if (estado === "Crecimiento") return { bg: "#e8f5e9", fg: VERDE };
        return { bg: "#f5f5f5", fg: "#555" };
    };

    return (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
                <tr style={{ background: "#f0f4f0" }}>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: GRIS, textTransform: "uppercase", letterSpacing: 0.5 }}>#</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: GRIS, textTransform: "uppercase", letterSpacing: 0.5 }}>Árbol</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: GRIS, textTransform: "uppercase", letterSpacing: 0.5 }}>Sección</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: GRIS, textTransform: "uppercase", letterSpacing: 0.5 }}>Surco</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: GRIS, textTransform: "uppercase", letterSpacing: 0.5 }}>Estado</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: GRIS, textTransform: "uppercase", letterSpacing: 0.5 }}>Alertas</th>
                </tr>
            </thead>
            <tbody>
                {arboles.slice(0, 10).map((a, i) => {
                    const { bg, fg } = badgeColor(a.estado);
                    const rankColor = i === 0 ? ROJO : i < 3 ? NARANJA : "#2d4a2d";
                    return (
                        <tr key={a.arbol_id} style={{ borderBottom: "1px solid #f0f4f0", background: i % 2 === 1 ? "#fafdf9" : "#fff" }}>
                            <td style={{ padding: "8px 10px", fontWeight: 800, color: rankColor, fontSize: 14 }}>{i + 1}</td>
                            <td style={{ padding: "8px 10px", fontWeight: 700, fontSize: 14 }}>{a.referencia}</td>
                            <td style={{ padding: "8px 10px", fontSize: 13 }}>{a.seccion}</td>
                            <td style={{ padding: "8px 10px", textAlign: "center", fontSize: 13, color: GRIS }}>#{a.surco}</td>
                            <td style={{ padding: "8px 10px", textAlign: "center" }}>
                                <span style={{
                                    fontSize: 12, fontWeight: 700,
                                    background: bg, color: fg,
                                    padding: "3px 8px", borderRadius: 6,
                                    display: "inline-block",
                                }}>
                                    {a.estado}
                                </span>
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 800, fontSize: 16, color: rankColor }}>
                                {a.totalAlertas}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const TreeHealthCharts: React.FC<{ data: ChartsData }> = ({ data }) => {
    const { top10Arboles, frecuenciaEnfermedades } = data;

    const enfermedadesConColor = frecuenciaEnfermedades.map((e, i) => ({
        ...e,
        color: PALETA[i % PALETA.length],
    }));

    return (
        <div style={{ width: "100%", fontFamily: "Inter, system-ui, sans-serif", color: "#2d4a2d" }}>

            {/* Fila: Dona + Top 10 */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

                {/* ── Dona ── ancho fijo generoso */}
                <div style={{
                    width: 260, flexShrink: 0,
                    background: "#fff", border: `1px solid ${BORDE}`,
                    borderRadius: 10, padding: "16px 18px",
                    boxSizing: "border-box",
                }}>
                    <h4 style={{
                        margin: "0 0 12px", fontSize: 13, fontWeight: 700,
                        color: VERDE, textTransform: "uppercase", letterSpacing: 0.8,
                    }}>
                        Frecuencia de Síntomas
                    </h4>
                    <DonaChart datos={enfermedadesConColor} />
                </div>

                {/* ── Top 10 ── ocupa el resto */}
                <div style={{
                    flex: 1,
                    background: "#fff", border: `1px solid ${BORDE}`,
                    borderRadius: 10, padding: "16px 18px",
                    boxSizing: "border-box",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: VERDE, textTransform: "uppercase", letterSpacing: 0.8 }}>
                            Top 10 — Árboles con más alertas de salud
                        </h4>
                        <span style={{
                            fontSize: 14, fontWeight: 500,
                            background: ROJO, color: "#fff",
                            padding: "5px 20px",
                            width: "300px",
                            height: "30px",
                            borderRadius: 4,
                            display: "flex",          /* Permite usar alineación flexible */
                            alignItems: "center",     /* Centra verticalmente */
                            justifyContent: "center",

                        }}>
                            Requieren atención
                        </span>
                    </div>
                    <Top10Tabla arboles={top10Arboles} />
                </div>
            </div>
        </div>
    );
};

export default TreeHealthCharts;