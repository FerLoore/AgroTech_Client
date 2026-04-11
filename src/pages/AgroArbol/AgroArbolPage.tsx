import { TreePine } from "lucide-react";
import { useAgroArbol } from "./useAgroArbol";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";
import { TipoArbol, type ArbolFormData } from "./agroArbol.types";
import { useNavigate } from "react-router-dom";


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
        kpiResumen,
        loading, error,
        busqueda, setBusqueda,
        filtroEstado, setFiltroEstado,
        filtroSurco, setFiltroSurco,
        filtroSeccion, setFiltroSeccion,
        filtroTipo, setFiltroTipo,
        filtroFinca, setFiltroFinca,
        fincas,
        surcosFiltrados,
        seccionesFiltradas,
        tiposArbol,
        modal, editando, form, setForm,
        guardando, formError,
        abrirCrear, abrirEditar,
        cerrarModal, handleGuardar, handleEliminar,
        opcionesTipoArbol, TIPOS_ARBOL_DINAMICO,
        opcionesSecciones, opcionesSurcos, setSeccionForm,
        page,
        setPage,
        totalPages
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
            } as ArbolFormData));
            return;
        }

        setForm(prev => ({
            ...prev,
            ...nuevoForm
        } as ArbolFormData));
    };

    const hayFiltrosActivos = filtroEstado || filtroTipo || filtroSurco || filtroSeccion || filtroFinca;

    const limpiarFiltros = () => {
        setFiltroEstado("");
        setFiltroTipo("");
        setFiltroSurco("");
        setFiltroSeccion("");
        setFiltroFinca("");
    };
    const navigate = useNavigate();

    return (
        <>
            <div style={{ padding: "32px 32px 0" }}>
                <div style={{ maxWidth: 960, margin: "0 auto" }}>

                    {/* Tarjetas resumen */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                        {[
                            { label: "Total árboles", value: kpiResumen?.total || 0, color: "#2d4a2d", bg: "#f5f0e8", border: "#d4c9b0" },
                            { label: "En producción", value: kpiResumen?.produccion || 0, color: "#185FA5", bg: "#E6F1FB", border: "#aecdf6" }, // Azul
                            { label: "En crecimiento", value: kpiResumen?.crecimiento || 0, color: "#4a7c59", bg: "#EAF3DE", border: "#93e0aa" }, // Verde
                            { label: "Enfermos", value: kpiResumen?.enfermo || 0, color: "#c0392b", bg: "#FAEEDA", border: "#f0d888" }, // Amarillo a Rojo
                        ].map(s => (
                            <div key={s.label} style={{
                                flex: "1 1 160px", background: s.bg,
                                border: `1.5px solid ${s.border}`,
                                borderRadius: 14, padding: "16px 20px"
                            }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#7a9a7a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    {s.label}
                                </p>
                                <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 700, color: s.color }}>
                                    {s.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Filtros — orden: Finca → Sección → Surco → Estado → Tipo */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>

                        {/* 1. Finca */}
                        <select
                            value={filtroFinca}
                            onChange={e => {
                                setFiltroFinca(e.target.value);
                                setFiltroSeccion(""); // reset sección al cambiar finca
                                setFiltroSurco("");   // reset surco al cambiar finca
                            }}
                            style={selectStyle}
                        >
                            <option value="">Todas las fincas</option>
                            {fincas.map(f => (
                                <option key={f.fin_finca} value={String(f.fin_finca)}>
                                    {f.fin_nombre}
                                </option>
                            ))}
                        </select>

                        {/* 2. Sección — muestra solo las de la finca seleccionada */}
                        <select
                            value={filtroSeccion}
                            onChange={e => {
                                setFiltroSeccion(e.target.value);
                                setFiltroSurco(""); // reset surco al cambiar sección
                            }}
                            style={selectStyle}
                        >
                            <option value="">Todas las secciones</option>
                            {seccionesFiltradas.map(s => (
                                <option key={s.secc_seccion} value={String(s.secc_seccion)}>
                                    {s.secc_nombre}
                                </option>
                            ))}
                        </select>

                        {/* 3. Surco — muestra solo los de la sección/finca seleccionada */}
                        <select
                            value={filtroSurco}
                            onChange={e => setFiltroSurco(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">Todos los surcos</option>
                            {surcosFiltrados.map(s => (
                                <option key={s.sur_surco} value={String(s.sur_surco)}>
                                    Surco {s.sur_numero_surco}
                                </option>
                            ))}
                        </select>

                        {/* 4. Estado */}
                        <select
                            value={filtroEstado}
                            onChange={e => setFiltroEstado(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">Todos los estados</option>
                            {Object.entries(TipoArbol).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>

                        {/* 5. Tipo */}
                        <select
                            value={filtroTipo}
                            onChange={e => setFiltroTipo(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">Todos los tipos</option>
                            {tiposArbol.map(t => (
                                <option key={t.tipar_tipo_arbol} value={String(t.tipar_tipo_arbol)}>
                                    {t.tipar_nombre_comun}
                                </option>
                            ))}
                        </select>

                        {/* Limpiar — solo aparece si hay algún filtro activo */}
                        {hayFiltrosActivos && (
                            <button
                                onClick={limpiarFiltros}
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
                subtitulo=""
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
                onHistorial={(arbol) => navigate(`/agro-arbol-timeline`, { state: { arbolId: String(arbol.arb_arbol) } })}
                page={page}
                totalPages={totalPages}
                onNextPage={() => setPage(page + 1)}
                onPrevPage={() => setPage(page - 1)}
            />
        </>
    );
};

export default AgroArbolPage;