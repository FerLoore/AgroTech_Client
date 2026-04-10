import { useState, useEffect, useMemo } from "react";
import { getTratamientos, createTratamiento, finalizarTratamiento } from "../../api/AgroTratamientos.api";
import { getProductos } from "../../api/AgroProducto.api";
import { getAlertas } from "../../api/AgroAlertaSalud.api";
import { TRATAMIENTO_FORM_INICIAL } from "./AgroTratamientos.types";
import { toast } from "sonner";

export const useAgroTratamientos = () => {
    const [tratamientos, setTratamientos] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [modal, setModal] = useState(false);
    
    // Ajustado para coincidir con CrudTabla
    const [form, setForm] = useState<Record<string, unknown>>(TRATAMIENTO_FORM_INICIAL as Record<string, unknown>);
    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [dataTratamientos, dataProductos, dataAlertas] = await Promise.all([
                getTratamientos(),
                getProductos().catch(() => []),
                getAlertas().catch(() => [])
            ]);
            setTratamientos(Array.isArray(dataTratamientos) ? dataTratamientos : (dataTratamientos?.tratamientos || dataTratamientos?.data || []));
            setProductos(Array.isArray(dataProductos) ? dataProductos : (dataProductos?.productos || dataProductos?.data || []));
            setAlertas(Array.isArray(dataAlertas) ? dataAlertas : (dataAlertas?.alertas || dataAlertas?.data || []));
        } catch (err) {
            setError("Error al cargar datos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const filtrados = useMemo(() => {
        return (tratamientos || []).filter(t => 
            String(t?.alertsalu_alerta_salud || "").toLowerCase().includes((busqueda || "").toLowerCase()) ||
            String(t?.trata_dosis || "").toLowerCase().includes((busqueda || "").toLowerCase())
        ).map((t: any) => {
            const alerta = (alertas || []).find(a => String(a?.alertsalud_id) === String(t?.alertsalu_alerta_salud));
            const prod = (productos || []).find(p => String(p?.produ_producto) === String(t?.produ_producto));
            return {
                ...t,
                alerta_nom: alerta ? `Alerta #${alerta.alertsalud_id} (Árbol ${alerta.arb_arbol})` : t?.alertsalu_alerta_salud,
                produ_producto_nom: prod ? prod.produ_nombre : t?.produ_producto
            };
        });
    }, [tratamientos, busqueda, alertas, productos]);

    const abrirCrear = () => { setForm(TRATAMIENTO_FORM_INICIAL as Record<string, unknown>); setFormError(""); setModal(true); };
    const cerrarModal = () => setModal(false);

    const handleGuardar = async () => {
        try {
            setGuardando(true);
            setFormError("");
            await createTratamiento({
                alertsalu_alerta_salud: Number(form.alertsalu_alerta_salud),
                produ_producto: Number(form.produ_producto),
                trata_cantidad: Number(form.trata_cantidad),
                trata_dosis: String(form.trata_dosis || ""),
                trata_fecha_inicio: String(form.trata_fecha_inicio || ""),
                trata_fecha_fin: String(form.trata_fecha_fin || ""),
                trata_observaciones: String(form.trata_observaciones || "")
            });
            toast.success("Prescripción creada y stock descontado.");
            setModal(false);
            cargarDatos();
        } catch (error: any) {
            setFormError(error.response?.data?.message || "Error al crear tratamiento. Revisa el stock.");
        } finally {
            setGuardando(false);
        }
    };

    const onFinalizarClick = async (item: any) => {
        if (item.trata_estado === "Finalizado") {
            toast.info("Este tratamiento ya está finalizado.");
            return;
        }
        if (window.confirm(`¿Finalizar tratamiento? Esto creará un historial.`)) {
            try {
                await finalizarTratamiento(item.trata_tratamientos);
                toast.success("Tratamiento finalizado exitosamente.");
                cargarDatos();
            } catch (error) {
                toast.error("Error al finalizar el tratamiento.");
            }
        }
    };

    return {
        tratamientos: filtrados, productos, alertas, loading, error, busqueda, setBusqueda,
        modal, form, setForm, guardando, formError,
        abrirCrear, cerrarModal, handleGuardar, onFinalizarClick
    };
};