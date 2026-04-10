import { useState, useEffect, useMemo } from "react";
import { getFumigaciones, createFumigacion, marcarRealizada } from "../../api/AgroFumigacion.api";
import { getProductos } from "../../api/AgroProducto.api";
import { getAgroSecciones } from "../../api/AgroSeccion.api"; 
import { toast } from "sonner";

export const useAgroFumigacion = () => {
    const [fumigaciones, setFumigaciones] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [secciones, setSecciones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [modal, setModal] = useState(false);
    
    // Tipado ajustado a CrudTabla
    const [form, setForm] = useState<Record<string, unknown>>({});
    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [dataFumi, dataProd, dataSecc] = await Promise.all([
                getFumigaciones(),
                getProductos().catch(() => []),
                getAgroSecciones().catch(() => []) 
            ]);
            setFumigaciones(Array.isArray(dataFumi) ? dataFumi : (dataFumi?.fumigaciones || dataFumi?.data || []));
            setProductos(Array.isArray(dataProd) ? dataProd : (dataProd?.productos || dataProd?.data || []));
            setSecciones(Array.isArray(dataSecc) ? dataSecc : (dataSecc?.secciones || dataSecc?.data || []));
        } catch (err) {
            setError("Error al cargar datos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const filtrados = useMemo(() => {
        return (fumigaciones || []).filter(f => 
            String(f?.fumi_estado || "").toLowerCase().includes((busqueda || "").toLowerCase())
        ).map(f => {
            const prod = (productos || []).find(p => String(p?.produ_producto) === String(f?.fumi_producto));
            const secc = (secciones || []).find(s => String(s?.secc_seccion) === String(f?.fumi_seccion));
            return {
                ...f,
                fumi_producto_nom: prod ? prod.produ_nombre : f?.fumi_producto,
                fumi_seccion_nom: secc ? (secc.secc_nombre || `Sección ${secc.secc_seccion}`) : f?.fumi_seccion
            };
        });
    }, [fumigaciones, busqueda, productos, secciones]);

    const abrirCrear = () => { setForm({}); setFormError(""); setModal(true); };
    const cerrarModal = () => setModal(false);

    const handleGuardar = async () => {
        try {
            setGuardando(true);
            setFormError("");
            await createFumigacion({
                fumi_seccion: Number(form.fumi_seccion),
                fumi_producto: Number(form.fumi_producto),
                fumi_fecha_programada: String(form.fumi_fecha_programada || ""),
                fumi_dosis: String(form.fumi_dosis || "")
            });
            toast.success("Fumigación programada exitosamente.");
            setModal(false);
            cargarDatos();
        } catch (error: any) {
            setFormError("Error al programar fumigación. Revisa los datos.");
        } finally {
            setGuardando(false);
        }
    };

    const onRealizadaClick = async (item: any) => {
        if (item.fumi_estado === "Realizado") {
            toast.info("Ya está marcada como realizada.");
            return;
        }
        if (window.confirm(`¿Marcar aplicación preventiva como realizada?`)) {
            try {
                await marcarRealizada(item.fumi_fumigacion);
                toast.success("Estado actualizado.");
                cargarDatos();
            } catch (error) {
                toast.error("Error al actualizar estado.");
            }
        }
    };

    return {
        fumigaciones: filtrados, productos, secciones, loading, error, busqueda, setBusqueda,
        modal, form, setForm, guardando, formError,
        abrirCrear, cerrarModal, handleGuardar, onRealizadaClick
    };
};