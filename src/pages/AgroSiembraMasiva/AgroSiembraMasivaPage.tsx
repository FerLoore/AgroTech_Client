import { Sprout } from "lucide-react";
import { useSiembraMasiva } from "./useSiembraMasiva";

const SiembraMasivaPage = () => {
    const {
        paso, setPaso,
        secciones, seccionId, setSeccionId,
        surcosFiltrados, surcoId, setSurcoId,
        tiposArbol, tipoArbol, setTipoArbol,
        posInicial, setPosInicial,
        cantidad, setCantidad,
        fechaSiembra, setFechaSiembra,
        loading, resultado,
        handleConfirmar, handleReset,
        puedeAvanzar,
    } = useSiembraMasiva();

    const PASOS = ["Sección", "Surco", "Detalles", "Confirmar"];

    return (
        <div style={{ padding: "32px" }}>
            <div style={{ maxWidth: 620, margin: "0 auto" }}>

                {/* Encabezado */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
                    <div style={{
                        background: "#4a7c59", borderRadius: 14, width: 48, height: 48,
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Sprout size={24} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>
                            Siembra masiva
                        </h1>
                        <p style={{ fontSize: 13, color: "#7a9a7a", margin: 0 }}>
                            Registra múltiples árboles en un solo paso
                        </p>
                    </div>
                </div>

                {/* Indicador de pasos */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
                    {PASOS.map((label, idx) => {
                        const num = idx + 1;
                        const done   = paso > num;
                        const active = paso === num;
                        return (
                            <div key={label} style={{ display: "flex", alignItems: "center", flex: idx < 3 ? 1 : "none" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: "50%",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 13, fontWeight: 600, flexShrink: 0,
                                        background: done ? "#4a7c59" : active ? "#4a7c59" : "#e8f0e0",
                                        color: done || active ? "#fff" : "#7a9a7a",
                                    }}>
                                        {done ? "✓" : num}
                                    </div>
                                    <span style={{
                                        fontSize: 13,
                                        fontWeight: active ? 600 : 400,
                                        color: active ? "#2d4a2d" : done ? "#4a7c59" : "#7a9a7a",
                                        whiteSpace: "nowrap"
                                    }}>
                                        {label}
                                    </span>
                                </div>
                                {idx < 3 && (
                                    <div style={{
                                        flex: 1, height: 1, margin: "0 12px",
                                        background: paso > num ? "#4a7c59" : "#e8f0e0"
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Tarjeta del paso actual */}
                <div style={{
                    background: "#fff", borderRadius: 20, padding: 28,
                    boxShadow: "0 2px 16px rgba(74,124,89,0.08)",
                    marginBottom: 16
                }}>

                    {/* PASO 1 — Sección */}
                    {paso === 1 && (
                        <div>
                            <h2 style={estiloTituloPaso}>¿En qué sección se siembra?</h2>
                            <p style={estiloSubtitulo}>Selecciona la sección de la finca</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                                {secciones.map(s => (
                                    <div
                                        key={s.secc_seccion}
                                        onClick={() => setSeccionId(String(s.secc_seccion))}
                                        style={{
                                            padding: "14px 18px", borderRadius: 12, cursor: "pointer",
                                            border: seccionId === String(s.secc_seccion)
                                                ? "2px solid #4a7c59"
                                                : "1.5px solid #e8f0e0",
                                            background: seccionId === String(s.secc_seccion)
                                                ? "#f0f7f0" : "#fff",
                                            fontWeight: seccionId === String(s.secc_seccion) ? 600 : 400,
                                            color: "#2d4a2d", fontSize: 14,
                                            transition: "all 0.15s"
                                        }}
                                    >
                                        {s.secc_nombre}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PASO 2 — Surco */}
                    {paso === 2 && (
                        <div>
                            <h2 style={estiloTituloPaso}>¿En qué surco?</h2>
                            <p style={estiloSubtitulo}>
                                {surcosFiltrados.length} surco{surcosFiltrados.length !== 1 ? "s" : ""} disponible{surcosFiltrados.length !== 1 ? "s" : ""} en esta sección
                            </p>
                            {surcosFiltrados.length === 0 ? (
                                <p style={{ color: "#aaa", fontSize: 13, marginTop: 16 }}>
                                    No hay surcos en esta sección. Crea uno primero en Gestión de Surcos.
                                </p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                                    {surcosFiltrados.map(s => (
                                        <div
                                            key={s.sur_surco}
                                            onClick={() => setSurcoId(String(s.sur_surco))}
                                            style={{
                                                padding: "14px 18px", borderRadius: 12, cursor: "pointer",
                                                border: surcoId === String(s.sur_surco)
                                                    ? "2px solid #4a7c59"
                                                    : "1.5px solid #e8f0e0",
                                                background: surcoId === String(s.sur_surco)
                                                    ? "#f0f7f0" : "#fff",
                                                fontWeight: surcoId === String(s.sur_surco) ? 600 : 400,
                                                color: "#2d4a2d", fontSize: 14,
                                                transition: "all 0.15s"
                                            }}
                                        >
                                            Surco {s.sur_numero_surco}
                                            <span style={{ fontSize: 12, color: "#7a9a7a", marginLeft: 8 }}>
                                                {s.sur_orientacion ?? ""}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PASO 3 — Detalles */}
                    {paso === 3 && (
                        <div>
                            <h2 style={estiloTituloPaso}>Detalles de la siembra</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>

                                <div>
                                    <label style={estiloLabel}>Tipo de árbol</label>
                                    <select
                                        value={tipoArbol}
                                        onChange={e => setTipoArbol(e.target.value)}
                                        style={estiloInput}
                                    >
                                        <option value="">Selecciona...</option>
                                        {tiposArbol.map(t => (
                                            <option key={t.tipar_tipo_arbol} value={String(t.tipar_tipo_arbol)}>
                                                {t.tipar_nombre_comun}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <label style={estiloLabel}>Posición inicial</label>
                                        <input
                                            type="number" min={1}
                                            value={posInicial}
                                            onChange={e => setPosInicial(Number(e.target.value))}
                                            style={estiloInput}
                                        />
                                    </div>
                                    <div>
                                        <label style={estiloLabel}>Cantidad de árboles</label>
                                        <input
                                            type="number" min={1} max={200}
                                            value={cantidad}
                                            onChange={e => setCantidad(Number(e.target.value))}
                                            style={estiloInput}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={estiloLabel}>Fecha de siembra</label>
                                    <input
                                        type="date"
                                        value={fechaSiembra}
                                        onChange={e => setFechaSiembra(e.target.value)}
                                        style={estiloInput}
                                    />
                                </div>

                                {/* Vista previa */}
                                <div style={{
                                    background: "#f0f7f0", border: "1px solid #c8d8c0",
                                    borderRadius: 10, padding: "12px 16px"
                                }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: "#4a7c59", margin: "0 0 4px" }}>
                                        VISTA PREVIA
                                    </p>
                                    <p style={{ fontSize: 13, color: "#2d4a2d", margin: 0 }}>
                                        Se crearán <strong>{cantidad} árboles</strong> en posiciones{" "}
                                        <strong>{posInicial} – {posInicial + cantidad - 1}</strong> del surco seleccionado.
                                        Estado inicial: <strong>Crecimiento</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASO 4 — Resultado */}
                    {paso === 4 && (
                        <div style={{ textAlign: "center", padding: "8px 0" }}>
                            {loading ? (
                                <>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
                                    <p style={{ color: "#4a7c59", fontWeight: 600, fontSize: 15 }}>
                                        Creando árboles...
                                    </p>
                                    <p style={{ color: "#7a9a7a", fontSize: 13 }}>
                                        Esto puede tomar unos segundos
                                    </p>
                                </>
                            ) : resultado ? (
                                <>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>
                                        {resultado.errores === 0 ? "✅" : "⚠️"}
                                    </div>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: "#2d4a2d", marginBottom: 4 }}>
                                        {resultado.creados} árbol{resultado.creados !== 1 ? "es" : ""} sembrado{resultado.creados !== 1 ? "s" : ""}
                                    </p>
                                    {resultado.errores > 0 && (
                                        <p style={{ fontSize: 13, color: "#a03020", marginBottom: 8 }}>
                                            {resultado.errores} posición{resultado.errores !== 1 ? "es" : ""} con error
                                            (probablemente ya ocupadas)
                                        </p>
                                    )}
                                    {resultado.mensajesError.length > 0 && (
                                        <div style={{
                                            background: "#fde8e0", borderRadius: 8,
                                            padding: "10px 14px", textAlign: "left", marginTop: 8
                                        }}>
                                            {resultado.mensajesError.map((m, i) => (
                                                <p key={i} style={{ fontSize: 12, color: "#a03020", margin: "2px 0" }}>
                                                    {m}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Botones de navegación */}
                {paso < 4 && (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
            onClick={() => setPaso(p => p - 1)}
            disabled={paso === 1}
            style={{
                padding: "10px 22px", fontSize: 14, borderRadius: 10,
                background: "#f0ece4",
                color: paso === 1 ? "#bbb" : "#6b8c6b",
                border: "none", fontWeight: 600,
                cursor: paso === 1 ? "default" : "pointer"
            }}
        >
            ← Atrás
        </button>
        <button
            onClick={paso === 3 ? handleConfirmar : () => setPaso(p => p + 1)}
            disabled={!puedeAvanzar}
            style={{
                padding: "10px 28px", fontSize: 14, borderRadius: 10,
                background: puedeAvanzar ? "#4a7c59" : "#c8d8c0",
                color: "#fff", border: "none", fontWeight: 600,
                cursor: puedeAvanzar ? "pointer" : "default"
            }}
        >
            {paso === 3 ? "Confirmar siembra" : "Siguiente →"}
        </button>
    </div>
)}

                {/* Botón reset después del resultado */}
                {paso === 4 && !loading && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                        <button onClick={handleReset} style={{
                            padding: "10px 24px", fontSize: 14, borderRadius: 10,
                            background: "#4a7c59", color: "#fff", border: "none",
                            fontWeight: 600, cursor: "pointer"
                        }}>
                            Nueva siembra
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Estilos reutilizables dentro del archivo
const estiloTituloPaso: React.CSSProperties = {
    fontSize: 18, fontWeight: 700, color: "#2d4a2d", margin: 0
};
const estiloSubtitulo: React.CSSProperties = {
    fontSize: 13, color: "#7a9a7a", margin: "4px 0 0"
};
const estiloLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "#6b8c6b",
    textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6
};
const estiloInput: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: 14,
    border: "1.5px solid #c8d8c0", borderRadius: 8,
    background: "#f9f6f0", color: "#2d4a2d", outline: "none",
    boxSizing: "border-box"
};

export default SiembraMasivaPage;