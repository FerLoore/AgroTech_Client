import React from "react";
import { TreePine, Rows3, MapPin, HeartPulse, AlertTriangle, ClipboardList, CheckCircle2 } from "lucide-react";
import type { StatsSummaryData } from "../types/report.types";

const VERDE      = "#4a7c59";
const GRIS       = "#7a9a7a";
const ROJO       = "#c0392b";
const NARANJA    = "#e67e22";
const AMARILLO   = "#b45309";
const BORDE      = "#d4e4d4";
const FONDO_CARD = "#fff";

const pct = (v: number, t: number) => (t === 0 ? 0 : Math.round((v / t) * 100));

const COLORES_ESTADO: Record<string, string> = {
    Crecimiento: "#3498db",
    Produccion:  "#4a7c59",
    Enfermo:     "#e67e22",
    Muerto:      "#7f8c8d",
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
    icon: React.ReactNode;
    titulo: string;
    valor: string | number;
    sub?: string;
    alerta?: boolean;
    neutral?: boolean;
}> = ({ icon, titulo, valor, sub, alerta = false, neutral = false }) => {
    const bg      = alerta ? "#fff5f5" : neutral ? "#f9fbf9" : "#f4fbf6";
    const border  = alerta ? "#f5c6c6" : neutral ? BORDE : "#b6d8c0";
    const numClr  = alerta ? ROJO : neutral ? "#555" : VERDE;
    const iconClr = alerta ? ROJO : neutral ? GRIS : VERDE;
    return (
        <div style={{
            flex: "1 1 120px",
            background: bg, border: `1px solid ${border}`,
            borderRadius: 10, padding: "14px 12px",
            boxSizing: "border-box",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            minHeight: 130,
        }}>
            {/* Icono */}
            <div style={{ color: iconClr, marginBottom: 6 }}>{icon}</div>
            {/* Etiqueta — una sola línea */}
            <div style={{
                fontSize: 10, color: GRIS, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.7px",
                textAlign: "center", marginBottom: 6,
                whiteSpace: "nowrap",
            }}>
                {titulo}
            </div>
            {/* Número */}
            <div style={{ fontSize: 34, fontWeight: 800, color: numClr, lineHeight: 1, marginBottom: 4 }}>
                {valor}
            </div>
            {/* Sub — siempre ocupa espacio para alinear todas las tarjetas */}
            <div style={{ fontSize: 12, color: alerta ? NARANJA : GRIS, visibility: sub ? "visible" : "hidden" }}>
                {sub ?? "—"}
            </div>
        </div>
    );
};

// ── Barra horizontal ──────────────────────────────────────────────────────────
const Barra: React.FC<{ label: string; cantidad: number; total: number }> = ({ label, cantidad, total }) => {
    const p     = pct(cantidad, total);
    const color = COLORES_ESTADO[label] ?? GRIS;
    const labelMap: Record<string, string> = {
        Produccion: "Producción", Crecimiento: "Crecimiento",
        Enfermo: "Enfermo",       Muerto: "Muerto",
    };
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: "#333" }}>{labelMap[label] ?? label}</span>
                <span style={{ color: GRIS }}>
                    {cantidad} árb. · <strong style={{ color }}>{p}%</strong>
                </span>
            </div>
            <div style={{ width: "100%", height: 10, background: "#e8f0e8", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${p}%`, height: "100%", background: color, borderRadius: 5 }} />
            </div>
        </div>
    );
};

// ── Componente principal ──────────────────────────────────────────────────────
const StatsSummary: React.FC<{ data: StatsSummaryData }> = ({ data }) => {
    const {
        totalArboles, totalSurcos, totalSecciones,
        arbolesEnAlerta, arbolesEnfermos, distribucionEstados,
        surcosCriticos, arbolesSOspechosos = [],
    } = data;

    const pctAlerta   = pct(arbolesEnAlerta, totalArboles);
    const pctEnfermos = pct(arbolesEnfermos, totalArboles);

    return (
        <div style={{ width: "100%", fontFamily: "Inter, system-ui, sans-serif", color: "#2d4a2d", boxSizing: "border-box" }}>

            {/* ── Título ── */}
            <h3 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 800, margin: "0 0 16px 0", color: "#2d4a2d" }}>
                <span style={{ width: 5, height: 20, background: VERDE, borderRadius: 2, display: "inline-block", flexShrink: 0 }} />
                <ClipboardList size={20} color={VERDE} />
                Estadísticas Generales del Inventario
            </h3>

            {/* ── KPI Cards ── */}
            <div data-pdf-avoid="true" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                <KpiCard icon={<TreePine size={22} />}       titulo="Árboles"      valor={totalArboles}    neutral />
                <KpiCard icon={<Rows3 size={22} />}          titulo="Surcos"       valor={totalSurcos}     neutral />
                <KpiCard icon={<MapPin size={22} />}         titulo="Secciones"    valor={totalSecciones}  neutral />
                <KpiCard
                    icon={<HeartPulse size={22} />} titulo="Enfermos"
                    valor={arbolesEnfermos}
                    sub={`${pctEnfermos}% del total`}
                    alerta={pctEnfermos > 10}
                />
                <KpiCard
                    icon={<AlertTriangle size={22} />} titulo="Sospechosos"
                    valor={arbolesEnAlerta}
                    sub={`${pctAlerta}% del total`}
                    alerta={arbolesEnAlerta > 0}
                />
            </div>

            {/* ── Distribución + Secciones críticas ── */}
            <div data-pdf-avoid="true" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>

                {/* Distribución por estado */}
                <div style={{ flex: "1 1 300px", background: FONDO_CARD, border: `1px solid ${BORDE}`, borderRadius: 10, padding: "16px 20px", boxSizing: "border-box" }}>
                    <h4 style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: VERDE, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                        Distribución por Estado
                    </h4>
                    {distribucionEstados.map(item => (
                        <Barra key={item.estado} label={item.estado} cantidad={item.cantidad} total={totalArboles} />
                    ))}
                </div>

                {/* Secciones que requieren atención */}
                <div style={{ flex: "1 1 260px", background: FONDO_CARD, border: `1px solid ${BORDE}`, borderRadius: 10, padding: "16px 20px", boxSizing: "border-box" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: VERDE, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                        Secciones que Requieren Atención
                    </h4>

                    {/* Cabecera */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 64px 56px", fontSize: 11, color: GRIS, textTransform: "uppercase", paddingBottom: 6, borderBottom: `1px solid ${BORDE}`, marginBottom: 4 }}>
                        <span>Sección</span>
                        <span style={{ textAlign: "center" }}>Total</span>
                        <span style={{ textAlign: "center" }}>Enfermos</span>
                        <span style={{ textAlign: "center" }}>Alerta</span>
                    </div>

                    {surcosCriticos.length === 0 ? (
                        <p style={{ fontSize: 13, color: GRIS, textAlign: "center", margin: "14px 0" }}>Sin secciones críticas ✔</p>
                    ) : surcosCriticos.map((s, i) => (
                        <div key={s.nombre} style={{ display: "grid", gridTemplateColumns: "1fr 56px 64px 56px", fontSize: 13, padding: "6px 0", alignItems: "center", borderBottom: i < surcosCriticos.length - 1 ? `1px solid #f0f4f0` : "none" }}>
                            <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nombre}</span>
                            <span style={{ textAlign: "center", color: GRIS }}>{s.total}</span>
                            <span style={{ textAlign: "center", fontWeight: 700, color: s.enfermos > 0 ? NARANJA : GRIS }}>{s.enfermos}</span>
                            <span style={{ textAlign: "center", fontWeight: 700, color: s.alertas > 0 ? ROJO : GRIS }}>{s.alertas}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tabla de Árboles Sospechosos ── */}
            {arbolesSOspechosos.length > 0 && (
                <div data-pdf-avoid="true" style={{
                    background: "#fffbf0", border: `1px solid #f0c040`,
                    borderRadius: 10, padding: "16px 20px",
                }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: AMARILLO, display: "flex", alignItems: "center", gap: 8 }}>
                        <AlertTriangle size={16} color={AMARILLO} /> Árboles en Estado Sospechoso — Requieren Inspección
                        <span style={{ marginLeft: "auto", fontSize: 12, background: AMARILLO, color: "#fff", padding: "3px 10px", borderRadius: 8, fontWeight: 700 }}>
                            {arbolesSOspechosos.length} árbol{arbolesSOspechosos.length > 1 ? "es" : ""}
                        </span>
                    </h4>
                    <p style={{ fontSize: 13, color: "#6b5900", margin: "0 0 12px 0" }}>
                        Llevan más años en etapa Crecimiento de lo esperado para su variedad. Se recomienda inspección presencial.
                    </p>

                    {/* Tabla */}
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: "#f5e880" }}>
                                <th style={{ padding: "7px 10px", textAlign: "left",   fontSize: 11, fontWeight: 700, color: "#6b5900", textTransform: "uppercase" }}>Árbol</th>
                                <th style={{ padding: "7px 10px", textAlign: "left",   fontSize: 11, fontWeight: 700, color: "#6b5900", textTransform: "uppercase" }}>Variedad</th>
                                <th style={{ padding: "7px 10px", textAlign: "left",   fontSize: 11, fontWeight: 700, color: "#6b5900", textTransform: "uppercase" }}>Sección</th>
                                <th style={{ padding: "7px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b5900", textTransform: "uppercase" }}>Surco</th>
                                <th style={{ padding: "7px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b5900", textTransform: "uppercase" }}>Siembra</th>
                                <th style={{ padding: "7px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b5900", textTransform: "uppercase" }}>Transcurrido</th>
                                <th style={{ padding: "7px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b5900", textTransform: "uppercase" }}>Esperado</th>
                                <th style={{ padding: "7px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#6b5900", textTransform: "uppercase" }}>Exceso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {arbolesSOspechosos.map((a, i) => (
                                <tr key={a.arbol_id} style={{ borderBottom: "1px solid #f5e880", background: i % 2 === 0 ? "#fffef5" : "#fffbf0" }}>
                                    <td style={{ padding: "7px 10px", fontWeight: 700, color: AMARILLO, fontSize: 14 }}>{a.referencia}</td>
                                    <td style={{ padding: "7px 10px", fontSize: 13 }}>{a.variedad}</td>
                                    <td style={{ padding: "7px 10px", fontSize: 13 }}>{a.seccion}</td>
                                    <td style={{ padding: "7px 10px", textAlign: "center", fontSize: 13, color: GRIS }}>#{a.surco}</td>
                                    <td style={{ padding: "7px 10px", textAlign: "center", fontSize: 13 }}>{new Date(a.fecha_siembra).getFullYear()}</td>
                                    <td style={{ padding: "7px 10px", textAlign: "center", fontSize: 13 }}>{a.anios_transcurridos} a.</td>
                                    <td style={{ padding: "7px 10px", textAlign: "center", fontSize: 13, color: GRIS }}>{a.anios_esperados} a.</td>
                                    <td style={{ padding: "7px 10px", textAlign: "center" }}>
                                        <span style={{
                                            fontWeight: 800, fontSize: 13, color: "#fff",
                                            background: a.exceso_anios > 3 ? ROJO : NARANJA,
                                            borderRadius: 5, padding: "2px 7px",
                                            display: "inline-block",
                                        }}>
                                            +{a.exceso_anios} a.
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Sin sospechosos */}
            {arbolesSOspechosos.length === 0 && (
                <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={16} color="#166534" />
                    <span><strong>Sin árboles en estado sospechoso.</strong> Todos los árboles en Crecimiento están dentro de su período esperado.</span>
                </div>
            )}
        </div>
    );
};

export default StatsSummary;