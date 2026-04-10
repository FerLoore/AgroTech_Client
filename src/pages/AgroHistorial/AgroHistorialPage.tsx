// AgroHistorialPage.tsx
import { Clock } from "lucide-react";
import CrudTabla from "../../components/CrudTabla";
import { useAgroHistorial } from "./useAgroHistorial";
import type { ColumnaConfig } from "../../components/CrudTabla";

// ------------------------------------------------------------
const COLUMNAS: ColumnaConfig[] = [
    { header: "ID", key: "histo_historial" },
    { header: "Árbol", key: "arb_arbol" },
    { header: "Estado Anterior", key: "histo_estado_anterior" },
    { header: "Estado Nuevo", key: "histo_estado_nuevo" },
    { header: "Fecha", key: "histo_fecha_cambio" },
    { header: "Motivo", key: "histo_motivo" },
    { header: "Usuario", key: "usu_usuario" },
];

// ------------------------------------------------------------
const AgroHistorialPage = () => {

    const {
        historialFiltrado,
        loading,
        error,
        busqueda,
        setBusqueda,
        page,
        setPage,
        totalPages
    } = useAgroHistorial();

    // Formatear la fecha antes de enviarla a CrudTabla
    const historialFormateado = historialFiltrado.map(h => ({
        ...h,
        histo_fecha_cambio: new Date(h.histo_fecha_cambio).toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
    }));
    

    return (
        <CrudTabla
            titulo="Historial de Cambios"
            subtitulo="AGRO_HISTORIAL"
            icono={Clock}
            columnas={COLUMNAS}
            datos={historialFormateado} // <- usamos los datos formateados
            idKey="histo_historial"
            campos={[]} // no hay formulario
            loading={loading}
            error={error}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            modal={false}
            editando={null}
            form={{}}
            setForm={() => {}}
            guardando={false}
            formError=""
            page={page}
            totalPages={totalPages}
            onNextPage={() => setPage(page + 1)}
            onPrevPage={() => setPage(page - 1)}
        />
    );
};

export default AgroHistorialPage;