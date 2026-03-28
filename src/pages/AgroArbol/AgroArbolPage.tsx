import { TreePine } from "lucide-react";
import { useAgroArbol } from "./useAgroArbol";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";
import { TipoArbol, type ArbolFormData } from "./agroArbol.types";

const CAMPOS = (opcionesTipoArbol: any[], opcionesSecciones: any[], opcionesSurcos: any[]): CampoFormulario[] => [
    { key: "arb_posicion_surco", label: "Posición", tipo: "number", requerido: true },
    { key: "arb_fecha_siembra", label: "Fecha Siembra", tipo: "date", requerido: true },
    {
        key: "tipar_tipo_arbol", label: "Tipo Árbol", tipo: "select", requerido: true,
        opciones: opcionesTipoArbol
    },
    {
        key: "arb_estado", label: "Estado", tipo: "select", requerido: true,
        opciones: Object.entries(TipoArbol).map(([valor, config]) => ({
            valor, label: config.label
        }))
    },
    {
        key: "secc_form",
        label: "Sección",
        tipo: "select",
        opciones: opcionesSecciones
    },
    {
        key: "sur_surcos",
        label: "Surco",
        tipo: "select",
        requerido: true,
        opciones: opcionesSurcos
    }
];

const selectStyle: React.CSSProperties = {
    padding: "9px 12px", fontSize: 13,
    border: "1.5px solid #c8d8c0", borderRadius: 10,
    background: "#fff", color: "#2d4a2d", outline: "none"
};

const AgroArbolPage = () => {

    const {
        arbolesFiltrados,
        loading, error,
        busqueda, setBusqueda,
        filtroEstado, setFiltroEstado,
        filtroSurco, setFiltroSurco,
        filtroSeccion, setFiltroSeccion,
        filtroTipo, setFiltroTipo,
        surcos, secciones, tiposArbol,
        modal, editando, form, setForm,
        guardando, formError,
        abrirCrear, abrirEditar,
        cerrarModal, handleGuardar, handleEliminar,
        opcionesTipoArbol, TIPOS_ARBOL_DINAMICO,
        modalHistorial, historialArbol, loadingHistorial,
        abrirHistorial, cerrarHistorial, arbolSeleccionado,
        opcionesSecciones, opcionesSurcos, setSeccionForm
    } = useAgroArbol();

    const COLUMNAS: ColumnaConfig[] = [
        { header: "Ref", key: "arb_referencia" },
        { header: "ID", key: "arb_arbol" },
        { header: "Fecha Siembra", key: "arb_fecha_siembra" },
        { header: "Edad (años)", key: "arb_edad" },
        { header: "Tipo Árbol", key: "tipar_tipo_arbol", badge: TIPOS_ARBOL_DINAMICO },
        { header: "Estado", key: "arb_estado", badge: TipoArbol },
        { header: "Surco", key: "sur_surcos" }
    ];

    const handleSetForm = (nuevoForm: Record<string, unknown>) => {
    const nuevaSeccion = String(nuevoForm.secc_form ?? "");
    const seccionActual = String((form as any).secc_form ?? "");

    if (nuevaSeccion !== seccionActual) {
        setSeccionForm(nuevaSeccion);

        setForm(prev => ({
            ...prev,
            ...nuevoForm,
            sur_surcos: ""
        } as ArbolFormData)); // 👈 CAST AQUÍ

        return;
    }

    setForm(prev => ({
        ...prev,
        ...nuevoForm
    } as ArbolFormData)); // 👈 Y AQUÍ
};

    return (
        <>
            <div style={{ padding: "32px 32px 0" }}>
                <div style={{ maxWidth: 960, margin: "0 auto" }}>

                    {/* Filtros */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={selectStyle}>
                            <option value="">Todos los estados</option>
                            {Object.entries(TipoArbol).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={selectStyle}>
                            <option value="">Todos los tipos</option>
                            {tiposArbol.map(t => (
                                <option key={t.tipar_tipo_arbol} value={String(t.tipar_tipo_arbol)}>
                                    {t.tipar_nombre_comun}
                                </option>
                            ))}
                        </select>
                        <select value={filtroSurco} onChange={e => setFiltroSurco(e.target.value)} style={selectStyle}>
                            <option value="">Todos los surcos</option>
                            {surcos.map(s => (
                                <option key={s.sur_surco} value={String(s.sur_surco)}>
                                    Surco {s.sur_numero_surco}
                                </option>
                            ))}
                        </select>
                        <select value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)} style={selectStyle}>
                            <option value="">Todas las secciones</option>
                            {secciones.map(s => (
                                <option key={s.secc_seccion} value={String(s.secc_secciones ?? s.secc_seccion)}>
                                    {s.secc_nombre}
                                </option>
                            ))}
                        </select>
                        {(filtroEstado || filtroTipo || filtroSurco || filtroSeccion) && (
                            <button
                                onClick={() => {
                                    setFiltroEstado("");
                                    setFiltroTipo("");
                                    setFiltroSurco("");
                                    setFiltroSeccion("");
                                }}
                                style={{
                                    padding: "9px 14px", fontSize: 12, cursor: "pointer",
                                    background: "#fde8e0", color: "#a03020",
                                    border: "none", borderRadius: 10, fontWeight: 600
                                }}
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <CrudTabla
                titulo="Gestión de Árboles"
                subtitulo="AGRO_ARBOL"
                icono={TreePine}
                columnas={COLUMNAS}
                datos={arbolesFiltrados}
                idKey="arb_arbol"
                campos={CAMPOS(opcionesTipoArbol, opcionesSecciones, opcionesSurcos)}
                loading={loading}
                error={error}
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                modal={modal}
                editando={editando}
                form={form}
                setForm={handleSetForm}
                guardando={guardando}
                formError={formError}
                onNuevo={abrirCrear}
                onEditar={abrirEditar}
                onEliminar={handleEliminar}
                onGuardar={handleGuardar}
                onCerrar={cerrarModal}
                onHistorial={abrirHistorial}
            />

            {/* Modal historial */}
            {modalHistorial && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 20, padding: 32,
                        width: "100%", maxWidth: 600,
                        boxShadow: "0 8px 40px rgba(0,0,0,0.18)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>
                                Historial árbol #{arbolSeleccionado?.arb_arbol}
                                <span style={{ fontWeight: 400, fontSize: 14, color: "#7a9a7a", marginLeft: 8 }}>
                                    {TIPOS_ARBOL_DINAMICO[arbolSeleccionado?.tipar_tipo_arbol as number]?.label}
                                </span>
                            </h2>
                            <button onClick={cerrarHistorial} style={{
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: 20, color: "#aaa", lineHeight: 1
                            }}>✕</button>
                        </div>
                        {loadingHistorial ? (
                            <p style={{ color: "#5a7a5a" }}>Cargando...</p>
                        ) : historialArbol.length === 0 ? (
                            <p style={{ color: "#aaa" }}>Sin registros de historial.</p>
                        ) : (
                            <div style={{ overflowY: "auto", maxHeight: "50vh" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ background: "#f5f0e8" }}>
                                            {["Fecha y hora", "Estado anterior", "", "Estado nuevo", "Motivo"].map((h, i) => (
                                                <th key={i} style={{
                                                    padding: "10px 12px", textAlign: i === 2 ? "center" : "left",
                                                    color: "#6b8c6b", fontWeight: 700, fontSize: 11, textTransform: "uppercase"
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historialArbol.map(h => (
                                            <tr key={h.histo_historial} style={{ borderBottom: "1px solid #f0ece4" }}>
                                                <td style={{ padding: "10px 12px" }}>
                                                    {new Date(h.histo_fecha_cambio).toLocaleString("es-ES", {
                                                        day: "2-digit", month: "2-digit", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </td>
                                                <td style={{ padding: "10px 12px", color: "#555" }}>
                                                    {h.histo_estado_anterior ?? "—"}
                                                </td>
                                                <td style={{ padding: "10px 12px", textAlign: "center", color: "#ccc", fontSize: 20, verticalAlign: "middle" }}>
                                                    →
                                                </td>
                                                <td style={{ padding: "10px 12px", fontWeight: 600, color: "#2d4a2d" }}>
                                                    {h.histo_estado_nuevo}
                                                </td>
                                                <td style={{ padding: "10px 12px", color: "#777" }}>
                                                    {h.histo_motivo}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!loadingHistorial && (
                            <p style={{ fontSize: 11, color: "#aaa", marginTop: 14 }}>
                                {historialArbol.length} registro{historialArbol.length !== 1 ? "s" : ""} encontrado{historialArbol.length !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default AgroArbolPage;