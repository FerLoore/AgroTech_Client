import { useAgroTrazabilidad } from "./useAgroTrazabilida";
import type { EventoTimeline } from "./useAgroTrazabilida";

// ─── Configuración visual por tipo de evento ─────────────────────────────────

const EVENTO_CONFIG: Record<string, {
    icono: string;
    colorLinea: string;
    colorFondo: string;
    colorBorde: string;
    colorIcono: string;
    etiqueta: string;
}> = {
    siembra: {
        icono: "🌱",
        colorLinea: "#86efac",
        colorFondo: "#f0fdf4",
        colorBorde: "#bbf7d0",
        colorIcono: "#16a34a",
        etiqueta: "Siembra",
    },
    historial: {
        icono: "🔄",
        colorLinea: "#93c5fd",
        colorFondo: "#eff6ff",
        colorBorde: "#bfdbfe",
        colorIcono: "#2563eb",
        etiqueta: "Cambio de estado",
    },
    alerta: {
        icono: "⚠️",
        colorLinea: "#fca5a5",
        colorFondo: "#fff7f7",
        colorBorde: "#fecaca",
        colorIcono: "#dc2626",
        etiqueta: "Alerta de salud",
    },
    tratamiento: {
        icono: "💊",
        colorLinea: "#c4b5fd",
        colorFondo: "#faf5ff",
        colorBorde: "#ddd6fe",
        colorIcono: "#7c3aed",
        etiqueta: "Tratamiento",
    },
};

// ─── Helper de fecha ──────────────────────────────────────────────────────────

const formatFecha = (iso?: string | null) => {
    if (!iso) return "Fecha no registrada";
    try {
        // Rompemos el string para evitar que JavaScript asuma que es UTC
        // y le reste horas empujándolo un día hacia atrás.
        const cruda = iso.split("T")[0];
        const [year, month, day] = cruda.split("-");
        const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

        return dateObj.toLocaleDateString("es-GT", {
            day: "2-digit", month: "long", year: "numeric",
        });
    } catch {
        return "Fecha inválida";
    }
};

const formatFechaCorta = (iso?: string | null) => {
    if (!iso) return "S/F";
    try {
        const cruda = iso.split("T")[0];
        const [year, month, day] = cruda.split("-");
        const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

        return dateObj.toLocaleDateString("es-GT", {
            day: "2-digit", month: "short", year: "numeric",
        });
    } catch {
        return "S/F";
    }
};

const calcularEdad = (fecha: string): number =>
    Math.floor((Date.now() - new Date(fecha).getTime()) / (365.25 * 24 * 3600 * 1000));

// ─── Tarjeta de evento ────────────────────────────────────────────────────────

const TarjetaEvento = ({ evento, esUltimo }: { evento: EventoTimeline; esUltimo: boolean }) => {
    const cfg = EVENTO_CONFIG[evento.tipo];

    return (
        <div style={{ display: "flex", gap: 16, position: "relative" }}>
            {/* Línea vertical + círculo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: cfg.colorFondo,
                    border: `2px solid ${cfg.colorBorde}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}>
                    {cfg.icono}
                </div>
                {!esUltimo && (
                    <div style={{
                        width: 2, flex: 1, minHeight: 24,
                        background: `linear-gradient(to bottom, ${cfg.colorLinea}, #e5e7eb)`,
                        marginTop: 4
                    }} />
                )}
            </div>

            {/* Contenido */}
            <div style={{
                flex: 1, marginBottom: esUltimo ? 0 : 20,
                background: cfg.colorFondo,
                border: `1.5px solid ${cfg.colorBorde}`,
                borderRadius: 12, padding: "14px 18px",
            }}>
                {/* Etiqueta + fecha */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.08em", color: cfg.colorIcono,
                        background: `${cfg.colorBorde}88`,
                        padding: "2px 8px", borderRadius: 20,
                    }}>
                        {cfg.etiqueta}
                    </span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                        {formatFechaCorta(evento.fecha)}
                    </span>
                </div>

                {/* Título */}
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                    {evento.titulo}
                </p>

                {/* Descripción */}
                {evento.descripcion && (
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
                        {evento.descripcion}
                    </p>
                )}
            </div>
        </div>
    );
};

// ─── Página principal ─────────────────────────────────────────────────────────

const AgroTrazabilidadPage = () => {
    const { arbol, eventos, loading, error, volver } = useAgroTrazabilidad();

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: 36, height: 36, border: "3px solid #bbf7d0",
                        borderTopColor: "#16a34a", borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 12px"
                    }} />
                    <p style={{ color: "#6b7280", fontSize: 14 }}>Cargando trazabilidad…</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
                <div style={{
                    background: "#fff7f7", border: "1.5px solid #fecaca",
                    borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 400
                }}>
                    <p style={{ fontSize: 32, margin: "0 0 8px" }}>⚠️</p>
                    <p style={{ fontWeight: 700, color: "#dc2626", margin: "0 0 4px" }}>Error al cargar</p>
                    <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 16px" }}>{error}</p>
                    <button onClick={volver} style={{
                        padding: "8px 20px", background: "#dc2626", color: "#fff",
                        border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13
                    }}>
                        ← Volver
                    </button>
                </div>
            </div>
        );
    }

    const edad = arbol ? calcularEdad(arbol.arb_fecha_siembra) : 0;

    return (
        <div style={{ padding: "32px", maxWidth: 780, margin: "0 auto" }}>

            {/* Botón volver */}
            <button
                onClick={volver}
                style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    marginBottom: 24, padding: "8px 16px",
                    background: "#f5f0e8", color: "#2d4a2d",
                    border: "1.5px solid #d4c9b0", borderRadius: 10,
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}
            >
                ← Volver
            </button>

            {/* Cabecera del árbol */}
            {arbol && (
                <div style={{
                    background: "#f0fdf4", border: "1.5px solid #bbf7d0",
                    borderRadius: 16, padding: "20px 24px", marginBottom: 32,
                    display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center"
                }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: "50%",
                        background: "#dcfce7", border: "2px solid #86efac",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28, flexShrink: 0
                    }}>
                        🌳
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#16a34a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Trazabilidad
                        </p>
                        <h1 style={{ margin: "2px 0 4px", fontSize: 22, fontWeight: 800, color: "#14532d" }}>
                            Árbol #{arbol.arb_arbol}
                        </h1>
                        <p style={{ margin: 0, fontSize: 13, color: "#4b7a4b" }}>
                            Sembrado el {formatFecha(arbol.arb_fecha_siembra)} · {edad > 0 ? `${edad} año${edad !== 1 ? "s" : ""}` : "< 1 año"}
                        </p>
                    </div>

                    {/* Estadísticas rápidas */}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {[
                            { label: "Eventos", value: eventos.length },
                            { label: "Alertas", value: eventos.filter(e => e.tipo === "alerta").length },
                            { label: "Tratamientos", value: eventos.filter(e => e.tipo === "tratamiento").length },
                        ].map(s => (
                            <div key={s.label} style={{
                                textAlign: "center", background: "#fff",
                                border: "1.5px solid #bbf7d0", borderRadius: 10,
                                padding: "8px 16px", minWidth: 70
                            }}>
                                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#16a34a" }}>{s.value}</p>
                                <p style={{ margin: 0, fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 20 }}>
                Línea de tiempo · {eventos.length} evento{eventos.length !== 1 ? "s" : ""}
            </h2>

            {eventos.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: 48,
                    background: "#f9fafb", borderRadius: 16,
                    border: "1.5px dashed #e5e7eb"
                }}>
                    <p style={{ fontSize: 32, margin: "0 0 8px" }}>🌿</p>
                    <p style={{ color: "#9ca3af", fontSize: 14 }}>No hay eventos registrados para este árbol.</p>
                </div>
            ) : (
                <div>
                    {eventos.map((evento, i) => (
                        <TarjetaEvento
                            key={evento.id}
                            evento={evento}
                            esUltimo={i === eventos.length - 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgroTrazabilidadPage;