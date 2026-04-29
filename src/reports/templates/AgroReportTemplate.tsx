import { forwardRef } from "react";
import { Map, BarChart2, ClipboardList } from "lucide-react";
import type { AgroReportData } from "../types/report.types";
import logo from "../../assets/AGROTECHLOGOsinfondo.png";
import StatsSummary from "../components/StatsSummary";
import TreeHealthCharts from "../components/TreeHealthCharts";

interface Props { data: AgroReportData; }

const VERDE     = "#4a7c59";
const VERDE_CLR = "#eaf2ec";
const GRIS      = "#7a9a7a";
const BORDE     = "#d4e4d4";
const ROJO      = "#c0392b";
const AMARILLO  = "#b45309";

// ── Título de sección ─────────────────────────────────────────────────────────
const SectionTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
    <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 14, paddingBottom: 10,
        borderBottom: `2px solid ${VERDE_CLR}`,
    }}>
        <span style={{ width: 5, height: 22, background: VERDE, borderRadius: 3, flexShrink: 0 }} />
        <span style={{ color: VERDE, display: "flex", alignItems: "center" }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#2d4a2d" }}>
            {children}
        </h3>
    </div>
);

// Bloque protegido contra corte de página
const Bloque: React.FC<{ children: React.ReactNode; mb?: number }> = ({ children, mb = 24 }) => (
    <div data-pdf-avoid="true" style={{ marginBottom: mb }}>
        {children}
    </div>
);

// ── Pill de incidencia ────────────────────────────────────────────────────────
const IncPill: React.FC<{ v: number }> = ({ v }) => {
    const bg = v > 25 ? "#fde8e8" : v > 10 ? "#fff8e6" : "#f0fdf4";
    const fg = v > 25 ? ROJO : v > 10 ? AMARILLO : "#166534";
    return (
        <span style={{ padding: "3px 10px", borderRadius: 12, fontWeight: 700, background: bg, color: fg, fontSize: 13 }}>
            {v}%
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
const AgroReportTemplate = forwardRef<HTMLDivElement, Props>(({ data }, ref) => (
    <div
        ref={ref}
        style={{
            width: 800,
            padding: "36px 44px",
            background: "#fff",
            fontFamily: "Inter, system-ui, sans-serif",
            color: "#2d4a2d",
            lineHeight: 1.6,
            boxSizing: "border-box",
        }}
    >
        {/* ══ ENCABEZADO ══════════════════════════════════════════ */}
        <div data-pdf-avoid="true" style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderBottom: `3px solid ${VERDE}`, paddingBottom: 16, marginBottom: 20,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <img src={logo} alt="AgroTech" style={{ height: 52, width: "auto" }} />
                <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: VERDE, letterSpacing: "-0.5px" }}>AGROTECH</h1>
                    <p style={{ margin: 0, fontSize: 12, color: GRIS, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                        Sistema de Gestión Agrícola Inteligente
                    </p>
                </div>
            </div>
            <div style={{ background: VERDE_CLR, borderRadius: 10, padding: "12px 18px", textAlign: "right", border: `1px solid ${BORDE}` }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#2d4a2d", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Informe Fitosanitario
                </div>
                <div style={{ fontSize: 12, color: GRIS, marginTop: 3 }}>Fecha: {data.fecha}</div>
                <div style={{ fontSize: 12, color: GRIS }}>
                    ID: <strong style={{ color: VERDE }}>#AT-{data.finca.id}-{Date.now().toString().slice(-4)}</strong>
                </div>
            </div>
        </div>

        {/* ══ DATOS DE LA FINCA ═══════════════════════════════════ */}
        <Bloque mb={20}>
            <div style={{
                background: VERDE_CLR, borderRadius: 10, padding: "14px 20px",
                border: `1px solid ${BORDE}`,
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16,
            }}>
                {[
                    { label: "Finca",        valor: data.finca.nombre },
                    { label: "Ubicación",    valor: data.finca.ubicacion },
                    { label: "Generado por", valor: data.autor },
                ].map(item => (
                    <div key={item.label}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: GRIS, textTransform: "uppercase", letterSpacing: 0.8 }}>
                            {item.label}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#2d4a2d", marginTop: 2 }}>
                            {item.valor}
                        </div>
                    </div>
                ))}
            </div>
        </Bloque>

        {/* ══ SECCIÓN 1 — MAPA ════════════════════════════════════ */}
        <Bloque>
            <SectionTitle icon={<Map size={18} />}>
                Análisis Espacial de Incidencia — {data.mapa.modo}
            </SectionTitle>

            <div style={{
                width: "100%", height: 220,
                background: "#f0f0f0", borderRadius: 12,
                overflow: "hidden", border: "1px solid #ddd", marginBottom: 14,
            }}>
                {data.mapa.snapshot ? (
                    <img src={data.mapa.snapshot} alt="Mapa"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#aaa", fontSize: 14 }}>
                        Captura de mapa no disponible
                    </div>
                )}
            </div>

            {/* Tabla de secciones */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                    <tr style={{ background: "#e8f0e0" }}>
                        {["Sección", "Total árboles", "Enfermos", "Incidencia"].map((h, i) => (
                            <th key={h} style={{
                                padding: "9px 14px", textAlign: i === 0 ? "left" : "center",
                                fontSize: 12, fontWeight: 700, color: "#2d4a2d",
                                textTransform: "uppercase", letterSpacing: 0.5,
                            }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.mapa.stats.map((s, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #eef2ee", background: idx % 2 === 1 ? "#fafdf9" : "#fff" }}>
                            <td style={{ padding: "8px 14px", fontWeight: 600, fontSize: 14 }}>{s.nombre}</td>
                            <td style={{ padding: "8px 14px", textAlign: "center", fontSize: 14 }}>{s.total}</td>
                            <td style={{
                                padding: "8px 14px", textAlign: "center", fontSize: 14,
                                color: s.enfermos > 0 ? ROJO : "inherit",
                                fontWeight: s.enfermos > 0 ? 700 : 400,
                            }}>{s.enfermos}</td>
                            <td style={{ padding: "8px 14px", textAlign: "center" }}>
                                <IncPill v={s.incidencia} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Bloque>

        {/* ══ SECCIÓN 2 — ESTADÍSTICAS ════════════════════════════ */}
        {data.estadisticas && (
            <Bloque>
                <StatsSummary data={data.estadisticas} />
            </Bloque>
        )}

        {/* ══ SECCIÓN 3 — GRÁFICOS ════════════════════════════════ */}
        {data.charts && (
            <Bloque>
                <SectionTitle icon={<BarChart2 size={18} />}>
                    Análisis de Alertas Fitosanitarias
                </SectionTitle>
                <TreeHealthCharts data={data.charts} />
            </Bloque>
        )}

        {/* ══ PIE DE PÁGINA ═══════════════════════════════════════ */}
        <div style={{
            marginTop: 16, paddingTop: 12,
            borderTop: `1px solid ${BORDE}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
            <p style={{ margin: 0, fontSize: 11, color: "#bbb" }}>
                Generado automáticamente por AgroTech® · Confidencial — uso exclusivo de {data.finca.nombre}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: GRIS, fontWeight: 600 }}>{data.fecha}</p>
        </div>
    </div>
));

AgroReportTemplate.displayName = "AgroReportTemplate";
export default AgroReportTemplate;