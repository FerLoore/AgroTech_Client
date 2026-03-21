import { useEffect, useState } from "react";
import {
    getAlertas,
    createAlerta,
    updateAlerta,
    deleteAlerta
} from "../../api/AgroAlertaSalud.api";

import type { AlertaSalud, AlertaSaludFormData } from "./AgroAlertaSalud.types";
import { ALERTA_SALUD_FORM_INICIAL } from "./AgroAlertaSalud.types";
import { toast } from "sonner";

export const useAgroAlertaSalud = () => {

    const [alertas, setAlertas] = useState<AlertaSalud[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [busqueda, setBusqueda] = useState("");

    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState<AlertaSalud | null>(null);

    const [form, setForm] = useState<AlertaSaludFormData>(ALERTA_SALUD_FORM_INICIAL);

    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");

    // ============================
    // CARGAR DATOS
    // ============================
    const cargarAlertas = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAlertas();
            setAlertas(Array.isArray(data) ? data : []);

        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al cargar alertas";
            setError(mensaje);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarAlertas();
    }, []);

    // ============================
    // FILTRO
    // ============================
    const alertasFiltradas = alertas.filter((a) =>
        String(a.alertsalud_fecha_deteccion ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        String(a.alertsalud_descripcion_sintoma ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        String(a.arb_arbol ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        String(a.usu_usuario ?? "").toLowerCase().includes(busqueda.toLowerCase())
    );

    // ============================
    // MODAL
    // ============================
    const abrirCrear = () => {
        setEditando(null);
        setForm(ALERTA_SALUD_FORM_INICIAL);
        setFormError("");
        setModal(true);
    };

    const abrirEditar = (alerta: AlertaSalud) => {
        setEditando(alerta);

        setForm({
            alertsalud_fecha_deteccion: String(alerta.alertsalud_fecha_deteccion ?? ""),
            alertsalud_descripcion_sintoma: String(alerta.alertsalud_descripcion_sintoma ?? ""),
            alertsalud_foto: String(alerta.alertsalud_foto ?? ""),
            arb_arbol: Number(alerta.arb_arbol ?? 0),
            usu_usuario: Number(alerta.usu_usuario ?? 0),
        });

        setFormError("");
        setModal(true);
    };

    const cerrarModal = () => {
        setModal(false);
    };

    // ============================
    // GUARDAR (FIX IMPORTANTE)
    // ============================
    const handleGuardar = async () => {

        if (!form.alertsalud_fecha_deteccion) {
            setFormError("La fecha es requerida");
            return;
        }

        if (!form.arb_arbol) {
            setFormError("El árbol es requerido");
            return;
        }

        if (!form.usu_usuario) {
            setFormError("El usuario es requerido");
            return;
        }

        try {
            setGuardando(true);
            setFormError("");

            // ⚠️ ESTE ES EL FIX CLAVE
            const payload = {
                fecha_deteccion: form.alertsalud_fecha_deteccion,
                descripcion_sintoma: form.alertsalud_descripcion_sintoma || "",
                foto: form.alertsalud_foto || "",
                arb_arbol: Number(form.arb_arbol),
                usu_usuario: Number(form.usu_usuario),
            };

            if (editando) {
                await updateAlerta(editando.alertsalud_id, payload);
                toast.success("Alerta actualizada correctamente");
            } else {
                await createAlerta(payload);
                toast.success("Alerta creada exitosamente");
            }

            setModal(false);
            await cargarAlertas();

        } catch (err: unknown) {
            console.error("ERROR GUARDAR ALERTA:", err);

            const mensaje = err instanceof Error
                ? err.message
                : "Error al guardar alerta";

            setFormError(mensaje);
            toast.error(mensaje);

        } finally {
            setGuardando(false);
        }
    };

    // ============================
    // ELIMINAR
    // ============================
    const handleEliminar = (alerta: AlertaSalud) => {
        toast.warning("¿Eliminar alerta?", {
            description: "Esta acción no se puede deshacer",
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        await deleteAlerta(alerta.alertsalud_id);
                        await cargarAlertas();
                        toast.success("Eliminado correctamente");
                    } catch (err) {
                        toast.error("Error al eliminar");
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} }
        });
    };

    return {
        alertas,
        alertasFiltradas,
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