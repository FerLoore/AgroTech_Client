import api from "../../api/Axios";
import { useState, useEffect, useMemo } from "react";
import { getSurcos } from "../../api/AgroSurco.api";
import { getAgroSecciones } from "../../api/AgroSeccion.api";
import { getTipoArboles } from "../../api/AgroTipoArbol.api";
import { createArbol } from "../../api/AgroArbol.api";
import { toast } from "sonner";

interface Resultado {
    creados: number;
    errores: number;
    mensajesError: string[];
}

export const useSiembraMasiva = () => {
    const [paso, setPaso]             = useState(1);
    const [secciones, setSecciones]   = useState<any[]>([]);
    const [surcos, setSurcos]         = useState<any[]>([]);
    const [tiposArbol, setTiposArbol] = useState<any[]>([]);

    const [seccionId, setSeccionId]       = useState("");
    const [surcoId, setSurcoId]           = useState("");
    const [tipoArbol, setTipoArbol]       = useState("");
    const [posInicial, setPosInicial]     = useState(1);
    const [cantidad, setCantidad]         = useState(10);
    const [fechaSiembra, setFechaSiembra] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [loading, setLoading]     = useState(false);
    const [resultado, setResultado] = useState<Resultado | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // getAgroSecciones devuelve la respuesta completa de axios
                // getSurcos y getTipoArboles ya devuelven el array directo
                const [surcoData, seccionRes, tiposData] = await Promise.all([
                    getSurcos(),
                    getAgroSecciones(),
                    getTipoArboles(),
                ]);

                setSurcos(surcoData);
                // Ajusta según lo que devuelva tu getAgroSecciones
                setSecciones(seccionRes?.data?.secciones ?? seccionRes?.data ?? seccionRes ?? []);
                setTiposArbol(tiposData);
            } catch {
                toast.error("Error al cargar catálogos");
            }
        };
        init();
    }, []);

    const surcosFiltrados = useMemo(() => {
        if (!seccionId) return surcos;
        return surcos.filter(s => String(s.secc_secciones) === seccionId);
    }, [surcos, seccionId]);

    const puedeAvanzar = useMemo(() => {
        if (paso === 1) return !!seccionId;
        if (paso === 2) return !!surcoId && surcosFiltrados.length > 0;
        if (paso === 3) return !!tipoArbol && cantidad > 0 && !!fechaSiembra;
        return false;
    }, [paso, seccionId, surcoId, surcosFiltrados, tipoArbol, cantidad, fechaSiembra]);

    const handleSetSeccion = (id: string) => {
        setSeccionId(id);
        setSurcoId(""); // resetea surco al cambiar sección
    };

    const handleConfirmar = async () => {
    setPaso(4);
    setLoading(true);

    try {
        // Consulta qué posiciones ya están ocupadas en ese surco
        const res = await api.get("/agro-arboles/posiciones-ocupadas", {
            params: { surco: surcoId }
        });
        const ocupadas: number[] = res.data.posiciones;

        let creados = 0;
        const mensajesError: string[] = [];

        for (let i = 0; i < cantidad; i++) {
            const posicion = posInicial + i;

            // Si está ocupada la salta sin llamar al backend
            if (ocupadas.includes(posicion)) {
                mensajesError.push(`Posición ${posicion}: ya ocupada`);
                continue;
            }

            try {
                await createArbol({
                    arb_posicion_surco: posicion,
                    arb_fecha_siembra:  fechaSiembra,
                    tipar_tipo_arbol:   Number(tipoArbol),
                    arb_estado:         "Crecimiento",
                    sur_surcos:         Number(surcoId),
                });
                creados++;
            } catch {
                mensajesError.push(`Posición ${posicion}: error del servidor`);
            }
        }

        setResultado({ creados, errores: mensajesError.length, mensajesError });

        if (mensajesError.length === 0) {
            toast.success(`${creados} árboles sembrados correctamente`);
        } else {
            toast.warning(`${creados} creados, ${mensajesError.length} con error`);
        }

    } catch {
        toast.error("Error al verificar posiciones");
    } finally {
        setLoading(false);
    }
};

    const handleReset = () => {
        setSeccionId("");
        setSurcoId("");
        setTipoArbol("");
        setPosInicial(1);
        setCantidad(10);
        setFechaSiembra(new Date().toISOString().split("T")[0]);
        setResultado(null);
        setPaso(1);
    };

    return {
        paso, setPaso,
        secciones,
        seccionId, setSeccionId: handleSetSeccion,
        surcosFiltrados,
        surcoId, setSurcoId,
        tiposArbol,
        tipoArbol, setTipoArbol,
        posInicial, setPosInicial,
        cantidad, setCantidad,
        fechaSiembra, setFechaSiembra,
        loading,
        resultado,
        handleConfirmar,
        handleReset,
        puedeAvanzar,
    };
};