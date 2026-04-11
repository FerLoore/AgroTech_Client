import { useEffect, useState, useMemo } from "react";
import { getAuditorias } from "../../api/AgroAuditoria.api";
import type { Auditoria } from "./AgroAuditoria.types";

export const useAgroAuditoria = () => {
    const [auditorias, setAuditorias]   = useState<Auditoria[]>([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState("");
    const [busqueda, setBusqueda]       = useState("");
    const [filtroTabla, setFiltroTabla] = useState("");
    const [filtroAccion, setFiltroAccion] = useState("");

    const cargar = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getAuditorias();
            setAuditorias(data);
        } catch {
            setError("Error al cargar auditoría");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const auditoriasFiltradas = useMemo(() => {
        return auditorias.filter(a => {
            const matchTabla   = filtroTabla   ? a.audi_tabla === filtroTabla     : true;
            const matchAccion  = filtroAccion  ? a.audi_accion === filtroAccion   : true;
            const matchBusqueda = busqueda
                ? Object.values(a).some(v =>
                    String(v ?? "").toLowerCase().includes(busqueda.toLowerCase())
                )
                : true;
            return matchTabla && matchAccion && matchBusqueda;
        });
    }, [auditorias, filtroTabla, filtroAccion, busqueda]);

    const tablas = useMemo(() =>
        [...new Set(auditorias.map(a => a.audi_tabla))].sort()
    , [auditorias]);

    return {
        auditoriasFiltradas,
        loading,
        error,
        busqueda,
        setBusqueda,
        filtroTabla,
        setFiltroTabla,
        filtroAccion,
        setFiltroAccion,
        tablas
    };
};