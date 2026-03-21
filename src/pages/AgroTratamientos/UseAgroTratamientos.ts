import { useEffect, useState } from "react";
import {
    getTratamientos,
    createTratamiento,
    updateTratamiento,
    deleteTratamiento
} from "../../api/AgroTratamientos.api";
import type { Tratamiento, TratamientoFormData } from "./AgroTratamientos.types";
import { TRATAMIENTO_FORM_INICIAL } from "./AgroTratamientos.types";
import { toast } from "sonner";

export const useAgroTratamientos = () => {
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState<Tratamiento | null>(null);
    const [form, setForm] = useState<TratamientoFormData>(TRATAMIENTO_FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");

    const cargarTratamientos = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getTratamientos();
            setTratamientos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error al cargar los tratamientos:", err);
            setError("Error al cargar los tratamientos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarTratamientos();
    }, []);

    const tratamientosFiltrados = tratamientos.filter((t) =>
        String(t.trata_estado ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        String(t.trata_dosis ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        String(t.alertsalu_alerta_salud ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        String(t.produ_producto ?? "").toLowerCase().includes(busqueda.toLowerCase())
    );

    const abrirCrear = () => {
        setEditando(null);
        setForm(TRATAMIENTO_FORM_INICIAL);
        setFormError("");
        setModal(true);
    };

    const abrirEditar = (t: Tratamiento) => {
        setEditando(t);
        setForm({
            trata_fecha_inicio: t.trata_fecha_inicio,
            trata_fecha_fin: t.trata_fecha_fin || "",
            trata_estado: t.trata_estado,
            trata_dosis: t.trata_dosis || "",
            trata_observaciones: t.trata_observaciones || "",
            alertsalu_alerta_salud: t.alertsalu_alerta_salud,
            produ_producto: t.produ_producto,
        });
        setFormError("");
        setModal(true);
    };

    const cerrarModal = () => setModal(false);

    const handleGuardar = async () => {
        if (!String(form.trata_fecha_inicio).trim()) {
            setFormError("La fecha de inicio es requerida");
            return;
        }

        if (!String(form.trata_estado).trim()) {
            setFormError("El estado es requerido");
            return;
        }

        if (!Number(form.alertsalu_alerta_salud)) {
            setFormError("La alerta de salud es requerida");
            return;
        }

        if (!Number(form.produ_producto)) {
            setFormError("El producto es requerido");
            return;
        }

        try {
            setGuardando(true);
            setFormError("");

            const payload = {
                trata_fecha_inicio: form.trata_fecha_inicio,
                trata_fecha_fin: form.trata_fecha_fin || "",
                trata_estado: form.trata_estado,
                trata_dosis: form.trata_dosis || "",
                trata_observaciones: form.trata_observaciones || "",
                alertsalu_alerta_salud: Number(form.alertsalu_alerta_salud),
                produ_producto: Number(form.produ_producto),
            };

            console.log("PAYLOAD TRATAMIENTO:", payload);

            if (editando) {
                await updateTratamiento(editando.trata_tratamientos, payload);
                toast.success("Tratamiento actualizado correctamente");
            } else {
                await createTratamiento(payload);
                toast.success("Tratamiento creado correctamente");
            }

            setModal(false);
            await cargarTratamientos();
        } catch (err: any) {
            console.error("ERROR REAL TRATAMIENTO:", err);
            setFormError(err?.message || "Error al guardar tratamiento");
            toast.error(err?.message || "Error al guardar tratamiento");
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = (t: Tratamiento) => {
        toast.warning("¿Eliminar tratamiento?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        await deleteTratamiento(t.trata_tratamientos);
                        await cargarTratamientos();
                        toast.success("Tratamiento eliminado correctamente");
                    } catch (err: any) {
                        toast.error(err?.message || "Error al eliminar");
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} },
        });
    };

    return {
        tratamientos,
        tratamientosFiltrados,
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
    };
};