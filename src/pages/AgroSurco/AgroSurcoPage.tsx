import { Ruler } from "lucide-react";
import { useAgroSurco } from "./useAgroSurco";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

const COLUMNAS: ColumnaConfig[] = [
    { header: "ID", key: "sur_surco" },
    { header: "Número", key: "sur_numero_surco" },
    { header: "Orientación", key: "sur_orientacion" },
    { header: "Espaciamiento", key: "sur_espaciamiento" },
    { header: "Sección", key: "secc_secciones" }
];


const AgroSurcoPage = () => {

    const {
        surcosFiltrados,
        loading,
        error,
        busqueda,
        setBusqueda,
        filtroFinca, setFiltroFinca,
        filtroSeccion, setFiltroSeccion,
        fincas,
        seccionesFiltradas,
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
        opcionesSecciones,
        page,
        setPage,
        totalPages
    } = useAgroSurco();

    const CAMPOS: CampoFormulario[] = [
        { key: "sur_numero_surco", label: "Número", tipo: "number", requerido: true },
        { key: "sur_orientacion", label: "Orientación", tipo: "text" },
        { key: "sur_espaciamiento", label: "Espaciamiento", tipo: "number", requerido: true },
        {
            key: "secc_secciones",
            label: "Sección",
            tipo: "select",
            requerido: true,
            opciones: opcionesSecciones
        }
    ];

    const selectStyle: React.CSSProperties = {
        padding: "8px 14px", fontSize: 13, border: "1.5px solid #d4c9b0",
        borderRadius: 10, background: "#fff", color: "#2d4a2d",
        cursor: "pointer", outline: "none", minWidth: 140
    };

    const hayFiltrosActivos = filtroSeccion || filtroFinca;

    const limpiarFiltros = () => {
        setFiltroSeccion("");
        setFiltroFinca("");
        setBusqueda("");
    };

    return (
        <>
            <div style={{ padding: "32px 32px 0" }}>
                <div style={{ maxWidth: 960, margin: "0 auto" }}>
                    {/* Filtros — orden: Finca → Sección */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>

                        {/* 1. Finca */}
                        <select
                            value={filtroFinca}
                            onChange={e => {
                                setFiltroFinca(e.target.value);
                                setFiltroSeccion(""); // Reset sección al cambiar finca
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

                        {/* 2. Sección */}
                        <select
                            value={filtroSeccion}
                            onChange={e => setFiltroSeccion(e.target.value)}
                            style={{ ...selectStyle, opacity: filtroFinca ? 1 : 0.6 }}
                            disabled={!filtroFinca}
                        >
                            <option value="">Todas las secciones</option>
                            {seccionesFiltradas.map(s => (
                                <option key={s.secc_seccion} value={String(s.secc_seccion)}>
                                    {s.secc_nombre}
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
            titulo="Gestión de Surcos"
            subtitulo="AGRO_SURCO"
            icono={Ruler}
            columnas={COLUMNAS}
            datos={surcosFiltrados}
            idKey="sur_surco"
            campos={CAMPOS}
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
            page={page}
            totalPages={totalPages}
            onNextPage={() => setPage(page + 1)}
            onPrevPage={() => setPage(page - 1)}
        />
        </>
    );
};

export default AgroSurcoPage;