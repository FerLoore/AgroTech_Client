import { TreePine } from "lucide-react";
import { useAgroArbol } from "./useAgroArbol";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";
import { TipoArbol } from "./agroArbol.types"; 


const CAMPOS = (opcionesTipoArbol: any[]): CampoFormulario[] => [
    { key: "arb_posicion_surco", label: "Posición", tipo: "number", requerido: true },
    { key: "arb_fecha_siembra", label: "Fecha Siembra", tipo: "date", requerido: true },
    {
        key: "tipar_tipo_arbol",
        label: "Tipo Árbol",
        tipo: "select",
        requerido: true,
        opciones: opcionesTipoArbol
    },
    {
        key: "arb_estado",
        label: "Estado",
        tipo: "select",
        requerido: true,
        opciones: Object.entries(TipoArbol).map(([valor, config]) => ({
            valor,
            label: config.label
        }))
    },
    { key: "sur_surcos", label: "Surco", tipo: "number", requerido: true }
];


const AgroArbolPage = () => {

    const {
        arbolesFiltrados,
        loading,
        error,
        busqueda,
        setBusqueda,
        modal,
        editando,
        form,
        setForm,
        guardando,
        formError,
        abrirCrear,
        abrirEditar,
        cerrarModal,
        handleGuardar,
        handleEliminar,
        opcionesTipoArbol,
        modalHistorial,
        historialArbol,
        loadingHistorial,
        abrirHistorial,
        cerrarHistorial,
        arbolSeleccionado,
        TIPOS_ARBOL_DINAMICO,
    } = useAgroArbol();

    
const COLUMNAS: ColumnaConfig[] = [
    { header: "ID", key: "arb_arbol" },
    { header: "Posición", key: "arb_posicion_surco" },
    { header: "Fecha Siembra", key: "arb_fecha_siembra" },
    {
        header: "Tipo Árbol",
        key: "tipar_tipo_arbol",
        badge: TIPOS_ARBOL_DINAMICO
    },
    {
        header: "Estado",
        key: "arb_estado",
        badge: TipoArbol
    },
    { header: "Surco", key: "sur_surcos" }
];

    return (
        <>
            <CrudTabla
                titulo="Gestión de Árboles"
                subtitulo="AGRO_ARBOL"
                icono={TreePine}
                columnas={COLUMNAS}
                datos={arbolesFiltrados}
                idKey="arb_arbol"
                campos={CAMPOS(opcionesTipoArbol || [])}
                loading={loading}
                error={error}
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                modal={modal}
                editando={editando}
                form={form}
                setForm={setForm as (f: Record<string, unknown>) => void}
                guardando={guardando}
                formError={formError}
                onNuevo={abrirCrear}
                onEditar={abrirEditar}
                onEliminar={handleEliminar}
                onGuardar={handleGuardar}
                onCerrar={cerrarModal}
                onHistorial={abrirHistorial}
            />
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
                                Historial de árbol #{arbolSeleccionado?.arb_arbol}
                                <span style={{ fontWeight: 400, fontSize: 18, color: "#0e500e", marginLeft: 8 }}>
                                    {TIPOS_ARBOL_DINAMICO[arbolSeleccionado?.tipar_tipo_arbol as keyof typeof TIPOS_ARBOL_DINAMICO]?.label}
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
                                            {["Fecha y Hora", "Estado anterior", "", "Estado nuevo", "Motivo"].map((h, i) => (
                                                <th key={i} style={{
                                                    padding: "10px 12px", textAlign: i === 2 ? "center" : "left",
                                                    color: "#6b8c6b", fontWeight: 700,
                                                    fontSize: 12, textTransform: "uppercase"
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
                                                <td style={{ padding: "10px 12px", color: "#555555" }}>
                                                    {h.histo_estado_anterior ?? "—"}
                                                </td>
                                                <td style={{ padding: "10px 12px", textAlign: "center", color: "#000000", fontSize: 29,  verticalAlign: "middle"  }}>
                                                    →
                                                </td>
                                                <td style={{ padding: "10px 12px", fontWeight: 600, color: "#2d4a2d" }}>
                                                    {h.histo_estado_nuevo}
                                                </td>
                                                <td style={{ padding: "10px 12px", color: "#585757" }}>
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