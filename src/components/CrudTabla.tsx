// ============================================================
// CrudTabla.tsx — Componente Visual Genérico
//
// Renderiza la vista completa de cualquier tabla CRUD:
//   encabezado + buscador + tabla + modal crear/editar
//
// Es 100% "tonto" — no tiene lógica de negocio ni llamadas
// a la API. Solo recibe datos y callbacks por props y los
// muestra. Toda la lógica vive en el hook de cada feature.
//
// Para usar en una nueva tabla solo necesitas:
//   1. Definir COLUMNAS (qué campos mostrar)
//   2. Definir CAMPOS (qué inputs tiene el formulario)
//   3. Pasar el estado y funciones del hook
// ============================================================

import React, { useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============================================================
// TIPOS EXPORTADOS
// Cada página importa estos tipos para definir su configuración
// ============================================================

// ------------------------------------------------------------
// CampoFormulario — define un input del modal
// ------------------------------------------------------------
export interface CampoFormulario {
    key: string;                                      // nombre del campo en el form (ej: "rol_nombre")
    label: string;                                      // texto encima del input
    tipo: "text" | "number" | "select" | "textarea" | "date";  // tipo de input a renderizar
    placeholder?: string;                                      // texto de ayuda dentro del input
    opciones?: { valor: string; label: string }[];          // solo para tipo "select"
    requerido?: boolean;                                     // marca visual (la validación real va en el hook)
}

// ------------------------------------------------------------
// CeldaBadge — define el estilo visual de un badge
// ------------------------------------------------------------
export interface CeldaBadge {
    label: string;  // texto del badge
    bg: string;  // color de fondo (ej: "#e8f0e0")
    text: string;  // color del texto (ej: "#4a7c59")
}

// ------------------------------------------------------------
// ColumnaConfig — define una columna de la tabla
// ------------------------------------------------------------
export interface ColumnaConfig {
    header: string;                                      // texto del encabezado
    key: string;                                      // nombre del campo en el objeto de datos
    badge?: Record<string | number, CeldaBadge>;         // opcional: si existe, la celda muestra badge
    render?: (valor: any, item: any) => React.ReactNode; // opcional: renderizado personalizado
    // la clave es el valor del campo (ej: 1, 2, 3, 4)
}

// ------------------------------------------------------------
// CrudTablaProps — todas las props que recibe el componente
//
// <T extends Record<string, unknown>> es un tipo genérico:
// significa "T puede ser cualquier objeto con claves string".
// Esto permite que CrudTabla funcione con Rol, TipoArbol,
// Producto, etc. sin duplicar código.
// ------------------------------------------------------------
interface CrudTablaProps<T extends Record<string, unknown>> {
    // ── Encabezado ──
    titulo: string;       // ej: "Gestión de Roles"
    subtitulo: string;       // ej: "AGRO_ROL"
    icono: LucideIcon;   // ícono de lucide-react para el encabezado y el modal

    // ── Tabla ──
    columnas: ColumnaConfig[];   // qué columnas mostrar y cómo
    datos: T[];               // lista de registros (ya filtrada por el hook)
    idKey: keyof T;           // qué campo es el PK, usado como key de React en las filas

    // ── Formulario del modal ──
    campos: CampoFormulario[]; // qué inputs tiene el modal

    // ── Estado de carga ──
    loading: boolean;           // muestra spinner mientras carga
    error: string;            // muestra error si falló la carga

    // ── Buscador ──
    busqueda: string;
    setBusqueda: (v: string) => void;

    // ── Estado del modal ──
    modal: boolean;           // si el modal está abierto
    editando: T | null;          // null = modo crear, T = modo editar
    form: Record<string, unknown>;              // valores actuales de los inputs
    setForm: (f: Record<string, unknown>) => void; // actualiza el form al escribir
    guardando: boolean;           // deshabilita el botón guardar mientras espera
    formError: string;            // error de validación o API dentro del modal

    // ── Callbacks — acciones del usuario ──
    onNuevo?: () => void;         // click en botón "Nuevo"
    onEditar?: (item: T) => void;  // click en botón "Editar" de una fila
    onEliminar?: (item: T) => void;  // click en botón "Desactivar" de una fila
    onGuardar?: () => void;         // click en botón "Guardar/Actualizar" del modal
    onCerrar?: () => void;         // click en "Cancelar" o fuera del modal
    onHistorial?: (item: T) => void;          // click en botón "Historial" de una fila
    labelEliminar?: string;
    extraFilters?: React.ReactNode;          // Componentes adicionales para filtrar
    // Paginación opcional
    page?: number;
    totalPages?: number;
    onNextPage?: () => void;
    onPrevPage?: () => void;
}

// ============================================================
// ESTILOS — definidos fuera del componente para no recrearlos
// en cada render
// ============================================================
const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: 14, marginTop: 6,
    border: "1.5px solid #c8d8c0", borderRadius: 8, background: "#f9f6f0",
    color: "#2d4a2d", outline: "none", boxSizing: "border-box"
};

// ============================================================
// COMPONENTE
// ============================================================
const CrudTabla = <T extends Record<string, unknown>>({
    titulo, subtitulo, icono: Icono,
    columnas, datos, idKey, campos,
    loading, error,
    busqueda, setBusqueda,
    modal, editando, form, setForm, guardando, formError,
    onNuevo, onEditar, onEliminar, onGuardar, onCerrar, onHistorial, labelEliminar = "Desactivar",
    extraFilters,
    page, totalPages, onNextPage, onPrevPage
}: CrudTablaProps<T>) => {

    // Estado local — solo afecta el hover visual de las filas
    // No necesita vivir en el hook porque no impacta la lógica de negocio
    const [hoveredRow, setHoveredRow] = useState<unknown>(null);

    // ── Estados de carga y error ──────────────────────────────
    // Se muestran en lugar de la tabla completa
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

                {/* ── Encabezado ──────────────────────────────────────
                    Muestra: ícono + título + subtítulo + botón Nuevo
                    El ícono viene como prop (LucideIcon) para que cada
                    tabla tenga su propio ícono representativo.
                ─────────────────────────────────────────────────── */}
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
                                {/* datos.length muestra cuántos registros hay DESPUÉS del filtro */}
                            </p>
                            {onHistorial && (
                                <p style={{ fontSize: 12, color: "#aaa", margin: "4px 0 0" }}>
                                    Haz click en una fila para ver su historial
                                </p>
                            )}
                        </div>
                    </div>
                    {onNuevo && (
                        <button onClick={onNuevo} style={{
                            background: "#4a7c59", color: "#fff", border: "none",
                            padding: "10px 20px", borderRadius: 10, fontSize: 14,
                            fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 7
                        }}>
                            <Plus size={16} /> Nuevo
                        </button>
                    )}
                </div>

                {/* ── Buscador ─────────────────────────────────────────
                    Controlled input — value viene del hook, onChange
                    actualiza el hook con setBusqueda.
                    El filtrado real ocurre en el hook (rolesFiltrados),
                    este input solo dispara la actualización.
                ─────────────────────────────────────────────────── */}
                <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
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
                    {extraFilters}
                </div>

                {/* ── Tabla ────────────────────────────────────────────
                    Los encabezados se generan desde el array COLUMNAS.
                    Las filas se generan iterando `datos` (ya filtrados).
                ─────────────────────────────────────────────────── */}
                <div style={{
                    background: "#fff", borderRadius: 16, overflow: "hidden",
                    boxShadow: "0 2px 16px rgba(74,124,89,0.08)"
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: "#e8f0e0" }}>
                                {/* Encabezados dinámicos desde COLUMNAS */}
                                {columnas.map(col => (
                                    <th key={col.key} style={{
                                        padding: "14px 20px", color: "#4a7c59", fontWeight: 700,
                                        fontSize: 12, textTransform: "uppercase", letterSpacing: 1,
                                        textAlign: "center"
                                    }}>{col.header}</th>
                                ))}
                                {/* Columna de acciones siempre al final */}
                                {(onEditar || onEliminar) && (
                                    <th style={{
                                        padding: "14px 20px", color: "#4a7c59", fontWeight: 700,
                                        fontSize: 12, textTransform: "uppercase", letterSpacing: 1,
                                        textAlign: "center"
                                    }}>
                                        Acciones
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Sin resultados */}
                            {datos.length === 0 ? (
                                <tr>
                                    <td colSpan={columnas.length + ((onEditar || onEliminar) ? 1 : 0)}
                                        style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
                                        No se encontraron registros
                                    </td>
                                </tr>
                            ) : datos.map((item, i) => (
                                <tr key={String(item[idKey])}
                                    // hover visual — solo estado local, no afecta el hook
                                    onClick={() => onHistorial?.(item)}
                                    onMouseEnter={() => setHoveredRow(item[idKey])}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    style={{
                                        background: hoveredRow === item[idKey]
                                            ? "#f0f7f0"                              // hover: verde muy suave
                                            : i % 2 === 0 ? "#fff" : "#f9f6f0",     // alterno: blanco / beige
                                        borderBottom: "1px solid #eee",
                                        transition: "background 0.12s",
                                        cursor: onHistorial ? "pointer" : "default"
                                    }}>

                                    {/* Celdas dinámicas según COLUMNAS */}
                                    {columnas.map(col => {
                                        const valor = item[col.key];

                                        // badge?: busca si este valor tiene un estilo de badge definido
                                        // ej: col.badge[1] = { label: "Operario", bg: "...", text: "..." }
                                        const badge = col.badge?.[valor as string | number];

                                        return (
                                            <td key={col.key} style={{ padding: "13px 20px", textAlign: "center", color: "#6b8c6b" }}>
                                                {col.render ? (
                                                    col.render(valor, item)
                                                ) : badge ? (
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

                                    {/* Columna de acciones — siempre igual en todas las tablas */}
                                    {(onEditar || onEliminar) && (
                                        <td style={{ padding: "13px 20px", textAlign: "center" }}>
                                            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>

                                                {onEditar && (
                                                    <button onClick={(e) => { e.stopPropagation(); onEditar(item); }} style={{
                                                        background: "#ddeedd", color: "#2d6a4f", border: "none",
                                                        padding: "6px 14px", borderRadius: 8, fontSize: 12,
                                                        fontWeight: 600, cursor: "pointer",
                                                        display: "flex", alignItems: "center", gap: 5
                                                    }}>
                                                        <Pencil size={12} /> Editar
                                                    </button>
                                                )}

                                                {onEliminar && (
                                                    <button onClick={(e) => { e.stopPropagation(); onEliminar(item); }} style={{
                                                        background: "#fde8e0", color: "#a03020", border: "none",
                                                        padding: "6px 14px", borderRadius: 8, fontSize: 12,
                                                        fontWeight: 600, cursor: "pointer",
                                                        display: "flex", alignItems: "center", gap: 5
                                                    }}>
                                                        <Trash2 size={12} /> {labelEliminar}
                                                    </button>
                                                )}

                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {page !== undefined && totalPages !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                        <p style={{ color: "#7a9a7a", fontSize: 14 }}>Página {page} de {totalPages}</p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={onPrevPage}
                                disabled={page <= 1}
                                style={{
                                    padding: "8px 16px", borderRadius: 8, border: "1px solid #c8d8c0",
                                    background: page <= 1 ? "#f9f6f0" : "#fff", color: page <= 1 ? "#aaa" : "#4a7c59",
                                    cursor: page <= 1 ? "not-allowed" : "pointer"
                                }}
                            >
                                Anterior
                            </button>
                            <button
                                onClick={onNextPage}
                                disabled={page >= totalPages}
                                style={{
                                    padding: "8px 16px", borderRadius: 8, border: "1px solid #c8d8c0",
                                    background: page >= totalPages ? "#f9f6f0" : "#fff", color: page >= totalPages ? "#aaa" : "#4a7c59",
                                    cursor: page >= totalPages ? "not-allowed" : "pointer"
                                }}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal crear/editar ────────────────────────────────
                Solo se renderiza cuando modal === true.
                Los inputs se generan dinámicamente desde CAMPOS.
                Soporta tres tipos: text/number, select, textarea.

                Controlled inputs:
                  value={String(form[campo.key] ?? "")}
                    → lee del estado del hook
                  onChange → setForm({ ...form, [campo.key]: valor })
                    → actualiza solo el campo que cambió,
                      manteniendo los demás con spread operator
            ─────────────────────────────────────────────────── */}
            {modal && onGuardar && onCerrar && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 20, padding: 32,
                        width: "100%", maxWidth: 440,
                        boxShadow: "0 8px 40px rgba(0,0,0,0.18)"
                    }}>
                        {/* Encabezado del modal */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                            <Icono size={20} color="#4a7c59" />
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>
                                {/* editando != null = modo editar, null = modo crear */}
                                {editando ? "Editar registro" : `Nuevo — ${titulo}`}
                            </h2>
                        </div>

                        {/* Inputs dinámicos desde CAMPOS */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {campos.map(campo => (
                                <div key={campo.key}>
                                    <label style={{
                                        fontSize: 11, fontWeight: 700, color: "#6b8c6b",
                                        textTransform: "uppercase", letterSpacing: 1
                                    }}>
                                        {campo.label}
                                    </label>

                                    {/* Renderiza el input correcto según campo.tipo */}
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
                                        // "text" o "number"
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

                            {/* Error de validación o de API — viene del hook */}
                            {formError && <p style={{ color: "#c0392b", fontSize: 12, margin: 0 }}>{formError}</p>}
                        </div>

                        {/* Botones del modal */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 28 }}>
                            <button onClick={onCerrar} style={{
                                padding: "10px 20px", fontSize: 14, background: "#f0ece4",
                                color: "#6b8c6b", border: "none", borderRadius: 10, cursor: "pointer"
                            }}>Cancelar</button>
                            <button onClick={onGuardar} disabled={guardando} style={{
                                padding: "10px 20px", fontSize: 14, background: "#4a7c59",
                                color: "#fff", border: "none", borderRadius: 10,
                                fontWeight: 600, cursor: "pointer",
                                opacity: guardando ? 0.6 : 1  // visual de "esperando"
                            }}>
                                {/* Texto cambia según contexto */}
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