// useAgroHistorial.ts
import { useEffect, useState, useMemo } from "react";
import { getHistorial } from "../../api/AgroHistorial.api";
import type { Historial } from "./agroHistorial.types";


// Hook para manejar el historial
export const useAgroHistorial = () => {
    const [historiales, setHistoriales] = useState<Historial[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [busqueda, setBusqueda] = useState<string>("");

    // Cargar los historiales desde la API
 useEffect(() => {
    const cargar = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getHistorial();
            if (Array.isArray(res)) {
                setHistoriales(res);
            } else {
                setError("Error al cargar historiales");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    cargar();
}, []);

    // Filtrar historiales según busqueda
    const historialFiltrado = useMemo(() => {
        if (!busqueda) return historiales;
        return historiales.filter(h =>
            Object.values(h)
                .some(v =>
                    v !== null &&
                    v !== undefined &&
                    String(v).toLowerCase().includes(busqueda.toLowerCase())
                )
        );
    }, [historiales, busqueda]);

    // Formatear las fechas para la tabla
    const historialFormateado = useMemo(() => {
        return historialFiltrado.map(h => ({
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
    }, [historialFiltrado]);

    return {
        historialFiltrado,
        historialFormateado,
        loading,
        error,
        busqueda,
        setBusqueda
    };
};