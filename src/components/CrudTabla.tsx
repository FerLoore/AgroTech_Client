import { useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────

export interface CampoFormulario {
    key:          string;
    label:        string;
    tipo:         "text" | "number" | "select" | "textarea";
    placeholder?: string;
    opciones?:    { valor: string; label: string }[];  // solo para tipo "select"
    requerido?:   boolean;
}

export interface CeldaBadge {
    label: string;
    bg:    string;
    text:  string;
}

export interface ColumnaConfig {
    header:  string;
    key:     string;
    badge?:  Record<string | number, CeldaBadge>;  // si la celda es un badge
}

interface CrudTablaProps<T extends Record<string, unknown>> {
    titulo:       string;
    subtitulo:    string;
    icono:        LucideIcon;
    columnas:     ColumnaConfig[];
    datos:        T[];
    idKey:        keyof T;               // qué campo es el PK (para el key de React)
    campos:       CampoFormulario[];     // campos del modal
    loading:      boolean;
    error:        string;
    busqueda:     string;
    setBusqueda:  (v: string) => void;
    modal:        boolean;
    editando:     T | null;
    form:         Record<string, unknown>;
    setForm:      (f: Record<string, unknown>) => void;
    guardando:    boolean;
    formError:    string;
    onNuevo:      () => void;
    onEditar:     (item: T) => void;
    onEliminar:   (item: T) => void;
    onGuardar:    () => void;
    onCerrar:     () => void;
}

// ─────────────────────────────────────────────────────────────
// Estilos reutilizables
// ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: 14, marginTop: 6,
    border: "1.5px solid #c8d8c0", borderRadius: 8, background: "#f9f6f0",
    color: "#2d4a2d", outline: "none", boxSizing: "border-box"
};

// ─────────────────────────────────────────────────────────────
// Componente genérico
// ─────────────────────────────────────────────────────────────
const CrudTabla = <T extends Record<string, unknown>>({
    titulo, subtitulo, icono: Icono,
    columnas, datos, idKey, campos,
    loading, error,
    busqueda, setBusqueda,
    modal, editando, form, setForm, guardando, formError,
    onNuevo, onEditar, onEliminar, onGuardar, onCerrar,
}: CrudTablaProps<T>) => {

    const [hoveredRow, setHoveredRow] = useState<unknown>(null);

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
        <div style={{ padding: "32px" }}>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>

                {/* Encabezado */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                            background: "#4a7c59", borderRadius: 14, width: 48, height: 48,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(74,124,89,0.25)"
                        }}>
                            <Icono size={24} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>{titulo}</h1>
                            <p style={{ fontSize: 13, color: "#7a9a7a", marginTop: 2 }}>
                                {subtitulo} — {datos.length} registros
                            </p>
                        </div>
                    </div>
                    <button onClick={onNuevo} style={{
                        background: "#4a7c59", color: "#fff", border: "none",
                        padding: "10px 20px", borderRadius: 10, fontSize: 14,
                        fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 7
                    }}>
                        <Plus size={16} /> Nuevo
                    </button>
                </div>

                {/* Buscador */}
                <div style={{ marginBottom: 16, position: "relative" }}>
                    <Search size={15} color="#7a9a7a" style={{
                        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)"
                    }} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{
                            width: "100%", padding: "10px 16px 10px 40px", fontSize: 14,
                            border: "1.5px solid #c8d8c0", borderRadius: 10,
                            background: "#fff", color: "#2d4a2d", outline: "none",
                            boxSizing: "border-box"
                        }}
                    />
                </div>

                {/* Tabla */}
                <div style={{
                    background: "#fff", borderRadius: 16, overflow: "hidden",
                    boxShadow: "0 2px 16px rgba(74,124,89,0.08)"
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: "#e8f0e0" }}>
                                {columnas.map(col => (
                                    <th key={col.key} style={{
                                        padding: "14px 20px", color: "#4a7c59", fontWeight: 700,
                                        fontSize: 12, textTransform: "uppercase", letterSpacing: 1,
                                        textAlign: "center"
                                    }}>{col.header}</th>
                                ))}
                                <th style={{
                                    padding: "14px 20px", color: "#4a7c59", fontWeight: 700,
                                    fontSize: 12, textTransform: "uppercase", letterSpacing: 1,
                                    textAlign: "center"
                                }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datos.length === 0 ? (
                                <tr>
                                    <td colSpan={columnas.length + 1}
                                        style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
                                        No se encontraron registros
                                    </td>
                                </tr>
                            ) : datos.map((item, i) => (
                                <tr key={String(item[idKey])}
                                    onMouseEnter={() => setHoveredRow(item[idKey])}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    style={{
                                        background: hoveredRow === item[idKey]
                                            ? "#f0f7f0"
                                            : i % 2 === 0 ? "#fff" : "#f9f6f0",
                                        borderBottom: "1px solid #eee",
                                        transition: "background 0.12s"
                                    }}>
                                    {columnas.map(col => {
                                        const valor = item[col.key];
                                        const badge = col.badge?.[valor as string | number];
                                        return (
                                            <td key={col.key} style={{ padding: "13px 20px", textAlign: "center", color: "#6b8c6b" }}>
                                                {badge ? (
                                                    <span style={{
                                                        padding: "4px 12px", borderRadius: 20, fontSize: 12,
                                                        fontWeight: 600, background: badge.bg, color: badge.text
                                                    }}>{badge.label}</span>
                                                ) : (
                                                    <span style={{
                                                        fontWeight: col.key === columnas[1]?.key ? 600 : 400,
                                                        color: col.key === columnas[1]?.key ? "#2d4a2d" : "#6b8c6b"
                                                    }}>
                                                        {String(valor ?? "—")}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td style={{ padding: "13px 20px", textAlign: "center" }}>
                                        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                                            <button onClick={() => onEditar(item)} style={{
                                                background: "#ddeedd", color: "#2d6a4f", border: "none",
                                                padding: "6px 14px", borderRadius: 8, fontSize: 12,
                                                fontWeight: 600, cursor: "pointer",
                                                display: "flex", alignItems: "center", gap: 5
                                            }}>
                                                <Pencil size={12} /> Editar
                                            </button>
                                            <button onClick={() => onEliminar(item)} style={{
                                                background: "#fde8e0", color: "#a03020", border: "none",
                                                padding: "6px 14px", borderRadius: 8, fontSize: 12,
                                                fontWeight: 600, cursor: "pointer",
                                                display: "flex", alignItems: "center", gap: 5
                                            }}>
                                                <Trash2 size={12} /> Desactivar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 20, padding: 32,
                        width: "100%", maxWidth: 440,
                        boxShadow: "0 8px 40px rgba(0,0,0,0.18)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                            <Icono size={20} color="#4a7c59" />
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>
                                {editando ? "Editar registro" : `Nuevo — ${titulo}`}
                            </h2>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {campos.map(campo => (
                                <div key={campo.key}>
                                    <label style={{
                                        fontSize: 11, fontWeight: 700, color: "#6b8c6b",
                                        textTransform: "uppercase", letterSpacing: 1
                                    }}>
                                        {campo.label}
                                    </label>

                                    {campo.tipo === "select" ? (
                                        <select
                                            value={String(form[campo.key] ?? "")}
                                            onChange={e => setForm({ ...form, [campo.key]: e.target.value })}
                                            style={inputStyle}
                                        >
                                            <option value="">Selecciona...</option>
                                            {campo.opciones?.map(op => (
                                                <option key={op.valor} value={op.valor}>{op.label}</option>
                                            ))}
                                        </select>
                                    ) : campo.tipo === "textarea" ? (
                                        <textarea
                                            value={String(form[campo.key] ?? "")}
                                            onChange={e => setForm({ ...form, [campo.key]: e.target.value })}
                                            placeholder={campo.placeholder}
                                            rows={3}
                                            style={{ ...inputStyle, resize: "vertical" }}
                                        />
                                    ) : (
                                        <input
                                            type={campo.tipo}
                                            value={String(form[campo.key] ?? "")}
                                            onChange={e => setForm({ ...form, [campo.key]: e.target.value })}
                                            placeholder={campo.placeholder}
                                            style={inputStyle}
                                        />
                                    )}
                                </div>
                            ))}
                            {formError && <p style={{ color: "#c0392b", fontSize: 12, margin: 0 }}>{formError}</p>}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 28 }}>
                            <button onClick={onCerrar} style={{
                                padding: "10px 20px", fontSize: 14, background: "#f0ece4",
                                color: "#6b8c6b", border: "none", borderRadius: 10, cursor: "pointer"
                            }}>Cancelar</button>
                            <button onClick={onGuardar} disabled={guardando} style={{
                                padding: "10px 20px", fontSize: 14, background: "#4a7c59",
                                color: "#fff", border: "none", borderRadius: 10,
                                fontWeight: 600, cursor: "pointer", opacity: guardando ? 0.6 : 1
                            }}>
                                {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrudTabla;