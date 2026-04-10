import { ShieldCheck } from "lucide-react";
import { useAgroAuditoria } from "./UseAgroAuditoria";
import { ACCION_BADGE } from "./AgroAuditoria.types";

const AgroAuditoriaPage = () => {

    const {
        auditoriasFiltradas,
        loading,
        error,
        busqueda,
        setBusqueda,
        filtroTabla,
        setFiltroTabla,
        filtroAccion,
        setFiltroAccion,
        tablas
    } = useAgroAuditoria();

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <p style={{ color: "#5a7a5a", fontSize: 18 }}>Cargando...</p>
        </div>
    );

    if (error) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <p style={{ color: "#c0392b", fontSize: 18 }}>{error}</p>
        </div>
    );

    return (
        <div style={{ padding: 32 }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>

                {/* Encabezado */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
                    <div style={{
                        background: "#4a7c59", borderRadius: 14, width: 48, height: 48,
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <ShieldCheck size={24} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>
                            Auditoría del sistema
                        </h1>
                        <p style={{ fontSize: 13, color: "#7a9a7a", marginTop: 2 }}>
                            AGRO_AUDITORIA
                        </p>
                    </div>
                </div>

                {/* Filtros */}
                <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{
                            flex: 1, minWidth: 200, padding: "10px 16px", fontSize: 14,
                            border: "1.5px solid #c8d8c0", borderRadius: 10,
                            background: "#fff", color: "#2d4a2d", outline: "none"
                        }}
                    />
                    <select
                        value={filtroTabla}
                        onChange={e => setFiltroTabla(e.target.value)}
                        style={{
                            padding: "10px 14px", fontSize: 14,
                            border: "1.5px solid #c8d8c0", borderRadius: 10,
                            background: "#fff", color: "#2d4a2d", outline: "none"
                        }}
                    >
                        <option value="">Todas las tablas</option>
                        {tablas.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <select
                        value={filtroAccion}
                        onChange={e => setFiltroAccion(e.target.value)}
                        style={{
                            padding: "10px 14px", fontSize: 14,
                            border: "1.5px solid #c8d8c0", borderRadius: 10,
                            background: "#fff", color: "#2d4a2d", outline: "none"
                        }}
                    >
                        <option value="">Todas las acciones</option>
                        <option value="INSERT">INSERT</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>

                {/* Tabla */}
                <div style={{
                    background: "#fff", borderRadius: 16, overflow: "hidden",
                    boxShadow: "0 2px 16px rgba(74,124,89,0.08)"
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: "#e8f0e0" }}>
                                {["Fecha", "Tabla", "Acción", "Campo", "Valor anterior", "Valor nuevo", "Usuario"].map(h => (
                                    <th key={h} style={{
                                        padding: "12px 16px", textAlign: "left",
                                        color: "#4a7c59", fontWeight: 700,
                                        fontSize: 11, textTransform: "uppercase", letterSpacing: 1
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {auditoriasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
                                        No se encontraron registros
                                    </td>
                                </tr>
                            ) : auditoriasFiltradas.map((a, i) => {
                                const badge = ACCION_BADGE[a.audi_accion as keyof typeof ACCION_BADGE];
                                return (
                                    <tr key={a.audi_auditoria} style={{
                                        borderBottom: "1px solid #f0ece4",
                                        background: i % 2 === 0 ? "#fff" : "#f9f6f0"
                                    }}>
                                        <td style={{ padding: "11px 16px", color: "#6b8c6b", whiteSpace: "nowrap" }}>
                                            {new Date(a.audi_fecha).toLocaleString("es-ES", {
                                                day: "2-digit", month: "2-digit", year: "numeric",
                                                hour: "2-digit", minute: "2-digit"
                                            })}
                                        </td>
                                        <td style={{ padding: "11px 16px", color: "#2d4a2d", fontWeight: 600 }}>
                                            {a.audi_tabla}
                                        </td>
                                        <td style={{ padding: "11px 16px" }}>
                                            {badge ? (
                                                <span style={{
                                                    padding: "3px 10px", borderRadius: 20,
                                                    fontSize: 11, fontWeight: 600,
                                                    background: badge.bg, color: badge.text
                                                }}>{badge.label}</span>
                                            ) : (
                                                <span style={{ color: "#999" }}>{a.audi_accion}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: "11px 16px", color: "#6b8c6b" }}>
                                            {a.audi_campo ?? "—"}
                                        </td>
                                        <td style={{ padding: "11px 16px", color: "#999", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {a.audi_valor_antes ?? "—"}
                                        </td>
                                        <td style={{ padding: "11px 16px", color: "#2d4a2d", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {a.audi_valor_despues ?? "—"}
                                        </td>
                                        <td style={{ padding: "11px 16px", color: "#6b8c6b" }}>
                                            {a.audi_usuario_nombre ?? "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AgroAuditoriaPage;