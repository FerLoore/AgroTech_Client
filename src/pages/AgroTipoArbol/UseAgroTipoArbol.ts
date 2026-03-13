// ============================================================
// useAgroTipoArbol.ts
// ============================================================

import { useEffect, useState } from "react";
import { getTipoArboles, createTipoArbol, updateTipoArbol, deleteTipoArbol } from "../../api/AgroTipoArbol.api";
import type { TipoArbol, TipoArbolFormData } from "./AgroTipoArbol.types";
import { TIPO_ARBOL_FORM_INICIAL } from "./AgroTipoArbol.types";
import { toast } from "sonner";

export const useAgroTipoArbol = () => {

    const [tipoArboles, setTipoArboles] = useState<TipoArbol[]>([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState("");
    const [busqueda, setBusqueda]       = useState("");
    const [modal, setModal]             = useState(false);
    const [editando, setEditando]       = useState<TipoArbol | null>(null);
    const [form, setForm]               = useState<TipoArbolFormData>(TIPO_ARBOL_FORM_INICIAL);
    const [guardando, setGuardando]     = useState(false);
    const [formError, setFormError]     = useState("");

    const cargarTipoArboles = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getTipoArboles();
            setTipoArboles(data);
        } catch {
            setError("Error al cargar los tipos de árbol. Verifica la conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarTipoArboles(); }, []);

    const tipoArbolesFiltrados = tipoArboles.filter(t =>
        t.tipar_nombre_comun.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.tipar_nombre_cientifico?.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.tipar_descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const abrirCrear = () => {
        setEditando(null);
        setForm(TIPO_ARBOL_FORM_INICIAL);
        setFormError("");
        setModal(true);
    };

    const abrirEditar = (tipoArbol: TipoArbol) => {
        setEditando(tipoArbol);
        setForm({
            tipar_nombre_comun:      tipoArbol.tipar_nombre_comun,
            tipar_nombre_cientifico: tipoArbol.tipar_nombre_cientifico || "",
            tipar_anios_produccion:  String(tipoArbol.tipar_anios_produccion),
            tipar_descripcion:       tipoArbol.tipar_descripcion || "",
        });
        setFormError("");
        setModal(true);
    };

    const cerrarModal = () => setModal(false);

    const handleGuardar = async () => {
        if (!form.tipar_nombre_comun.trim()) {
            setFormError("El nombre común es requerido");
            return;
        }
        if (form.tipar_anios_produccion && Number(form.tipar_anios_produccion) <= 0) {
            setFormError("Los años de producción deben ser mayor a 0");
            return;
        }

        try {
            setGuardando(true);
            setFormError("");

            const payload = {
                tipar_nombre_comun:      form.tipar_nombre_comun,
                tipar_nombre_cientifico: form.tipar_nombre_cientifico || undefined,
                tipar_anios_produccion:  form.tipar_anios_produccion ? Number(form.tipar_anios_produccion) : undefined,
                tipar_descripcion:       form.tipar_descripcion || undefined,
            };

            if (editando) {
                await updateTipoArbol(editando.tipar_tipo_arbol, payload);
                toast.success("Tipo de árbol actualizado correctamente");
            } else {
                await createTipoArbol(payload);
                toast.success("Tipo de árbol creado exitosamente");
            }

            setModal(false);
            cargarTipoArboles();

        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al guardar";
            setFormError(mensaje);
            toast.error(mensaje);
        } finally {
            setGuardando(false);
        }
    };

    // DELETE físico — el botón dirá "Eliminar" en la tabla
    const handleEliminar = (tipoArbol: TipoArbol) => {
        toast.warning(`¿Eliminar "${tipoArbol.tipar_nombre_comun}"?`, {
            description: "Esta acción es permanente y no se puede deshacer.",
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        await deleteTipoArbol(tipoArbol.tipar_tipo_arbol);
                        cargarTipoArboles();
                        toast.success("Tipo de árbol eliminado correctamente");
                    } catch (err: unknown) {
                        const mensaje = err instanceof Error ? err.message : "Error al eliminar";
                        toast.error(mensaje);
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} },
        });
    };

    return {
        tipoArboles, tipoArbolesFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        abrirCrear, abrirEditar, cerrarModal, handleGuardar, handleEliminar,
    };
};