import { useAgroRol } from "./useAgroRol";
import type { Rol, ModalProps } from "./agroRol.types";
import { NIVEL_PERMISO } from "./agroRol.types";
import { Pencil, Trash2, ShieldCheck, Plus, Search } from "lucide-react";

const AgroRolPage = () => {
    const {
        roles, rolesFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        abrirCrear, abrirEditar, cerrarModal, handleGuardar, handleEliminar,
    } = useAgroRol();

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <p style={{ color: "#5a7a5a", fontSize: 18 }}>Cargando roles...</p>
        </div>
    );

    if (error) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <p style={{ color: "#c0392b", fontSize: 18 }}>{error}</p>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#f5f0e8", padding: "40px 32px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>

                {/* Encabezado */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                            background: "#4a7c59", borderRadius: 14, width: 48, height: 48,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(74,124,89,0.25)"
                        }}>
                            <ShieldCheck size={26} color="#fff" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>Gestión de Roles</h1>
                            <p style={{ fontSize: 13, color: "#7a9a7a", marginTop: 2 }}>AGRO_ROL — {roles.length} roles activos</p>
                        </div>
                    </div>
                    <button onClick={abrirCrear} style={{
                        background: "#4a7c59", color: "#fff", border: "none",
                        padding: "10px 20px", borderRadius: 10, fontSize: 14,
                        fontWeight: 600, cursor: "pointer", display: "flex",
                        alignItems: "center", gap: 7
                    }}>
                        <Plus size={16} /> Nuevo Rol
                    </button>
                </div>

                {/* Buscador */}
                <div style={{ marginBottom: 16, position: "relative" }}>
                    <Search size={16} color="#7a9a7a" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o descripción..."
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
                <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 16px rgba(74,124,89,0.10)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: "#e8f0e0" }}>
                                {["ID", "Nombre", "Descripción", "Nivel", "Acciones"].map(col => (
                                    <th key={col} style={{
                                        padding: "14px 20px", color: "#4a7c59", fontWeight: 700,
                                        fontSize: 12, textTransform: "uppercase", letterSpacing: 1,
                                        textAlign: "center"
                                    }}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rolesFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#aaa" }}>
                                        No se encontraron roles
                                    </td>
                                </tr>
                            ) : rolesFiltrados.map((rol, i) => (
                                <FilaRol key={rol.rol_rol} rol={rol} onEditar={abrirEditar} onEliminar={handleEliminar} par={i % 2 === 0} />
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>

            {modal && (
                <Modal
                    editando={editando}
                    form={form}
                    setForm={setForm}
                    guardando={guardando}
                    formError={formError}
                    onGuardar={handleGuardar}
                    onCerrar={cerrarModal}
                />
            )}
        </div>
    );
};

const FilaRol = ({ rol, onEditar, onEliminar, par }: {
    rol: Rol; par: boolean;
    onEditar: (r: Rol) => void;
    onEliminar: (r: Rol) => void;
}) => {
    const nivel = NIVEL_PERMISO[rol.rol_permiso];
    return (
        <tr style={{ background: par ? "#fff" : "#f9f6f0", borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "14px 20px", textAlign: "center", color: "#8aaa8a", fontFamily: "monospace" }}>{rol.rol_rol}</td>
            <td style={{ padding: "14px 20px", textAlign: "center", fontWeight: 600, color: "#2d4a2d" }}>{rol.rol_nombre}</td>
            <td style={{ padding: "14px 20px", textAlign: "center", color: "#6b8c6b" }}>{rol.rol_descripcion || "—"}</td>
            <td style={{ padding: "14px 20px", textAlign: "center" }}>
                <span style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 12,
                    fontWeight: 600, background: nivel?.bg, color: nivel?.text
                }}>
                    {nivel?.label} 
                </span>
            </td>
            <td style={{ padding: "14px 20px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <button onClick={() => onEditar(rol)} title="Editar" style={{
                        background: "#ddeedd", color: "#2d6a4f", border: "none",
                        padding: "7px 14px", borderRadius: 8, fontSize: 12,
                        fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5
                    }}>
                        <Pencil size={13} /> Editar
                    </button>
                    <button onClick={() => onEliminar(rol)} title="Desactivar" style={{
                        background: "#fde8e0", color: "#a03020", border: "none",
                        padding: "7px 14px", borderRadius: 8, fontSize: 12,
                        fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5
                    }}>
                        <Trash2 size={13} /> Desactivar
                    </button>
                </div>
            </td>
        </tr>
    );
};

const Campo = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#6b8c6b", textTransform: "uppercase", letterSpacing: 1 }}>
            {label}
        </label>
        {children}
    </div>
);

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: 14, marginTop: 6,
    border: "1.5px solid #c8d8c0", borderRadius: 8, background: "#f9f6f0",
    color: "#2d4a2d", outline: "none", boxSizing: "border-box"
};

const Modal = ({ editando, form, setForm, guardando, formError, onGuardar, onCerrar }: ModalProps) => (
    <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
    }}>
        <div style={{
            background: "#fff", borderRadius: 20, padding: 32,
            width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.18)"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <ShieldCheck size={22} color="#4a7c59" />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>
                    {editando ? `Editar Rol #${editando.rol_rol}` : "Nuevo Rol"}
                </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Campo label="Nombre">
                    <input type="text" value={form.rol_nombre}
                        onChange={e => setForm({ ...form, rol_nombre: e.target.value })}
                        placeholder="Ej: Auditor" style={inputStyle} />
                </Campo>
                <Campo label="Descripción">
                    <input type="text" value={form.rol_descripcion}
                        onChange={e => setForm({ ...form, rol_descripcion: e.target.value })}
                        placeholder="Descripción opcional" style={inputStyle} />
                </Campo>
                <Campo label="Nivel de Permiso">
                    <select value={form.rol_permiso}
                        onChange={e => setForm({ ...form, rol_permiso: e.target.value })}
                        style={inputStyle}>
                        <option value="">Selecciona un nivel</option>
                        <option value="1">1 — Operario</option>
                        <option value="2">2 — Supervisor</option>
                        <option value="3">3 — Agrónomo</option>
                        <option value="4">4 — Admin</option>
                    </select>
                </Campo>
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
);

export default AgroRolPage;