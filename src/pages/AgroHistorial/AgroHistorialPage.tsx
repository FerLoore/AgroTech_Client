// AgroHistorialPage.tsx
import { useState } from "react";
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
    } = useAgroHistorial();

    const [pagina, setPagina] = useState(1);
    const POR_PAGINA = 10;
    const totalPaginas    = Math.max(1, Math.ceil(historialFiltrado.length / POR_PAGINA));
    const paginaActual    = Math.min(pagina, totalPaginas);
    const desde           = (paginaActual - 1) * POR_PAGINA;
    const mostrando       = historialFiltrado.length === 0 ? "0" : `${desde + 1}–${Math.min(desde + POR_PAGINA, historialFiltrado.length)}`;

    // Formatear la fecha antes de enviarla a CrudTabla
    const historialFormateado = historialFiltrado.slice(desde, desde + POR_PAGINA).map(h => ({
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
        <>
        <CrudTabla
            titulo="Historial de Cambios"
            subtitulo={`AGRO_HISTORIAL — Mostrando ${mostrando} de ${historialFiltrado.length}`}
            icono={Clock}
            columnas={COLUMNAS}
            datos={historialFormateado}
            idKey="histo_historial"
            campos={[]}
            loading={loading}
            error={error}
            busqueda={busqueda}
            setBusqueda={e => { setBusqueda(e); setPagina(1); }}
            modal={false}
            editando={null}
            form={{}}
            setForm={() => {}}
            guardando={false}
            formError=""
        />

        {/* Paginación estilo AlertaSalud */}
        {totalPaginas > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, paddingBottom: 32 }}>
                <button
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    style={{
                        padding: "6px 14px", fontSize: 13, fontWeight: 600, borderRadius: 8,
                        border: "none", cursor: paginaActual === 1 ? "default" : "pointer",
                        background: "#e8f0e0", color: "#4a7c59",
                        opacity: paginaActual === 1 ? 0.4 : 1
                    }}
                >Anterior</button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPagina(n)} style={{
                        padding: "6px 12px", fontSize: 13, fontWeight: 600, borderRadius: 8,
                        border: "none", cursor: "pointer",
                        background: n === paginaActual ? "#4a7c59" : "#e8f0e0",
                        color: n === paginaActual ? "#fff" : "#4a7c59"
                    }}>{n}</button>
                ))}
                <button
                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    style={{
                        padding: "6px 14px", fontSize: 13, fontWeight: 600, borderRadius: 8,
                        border: "none", cursor: paginaActual === totalPaginas ? "default" : "pointer",
                        background: "#e8f0e0", color: "#4a7c59",
                        opacity: paginaActual === totalPaginas ? 0.4 : 1
                    }}
                >Siguiente</button>
            </div>
        )}
        </>
    );
};

export default AgroHistorialPage;