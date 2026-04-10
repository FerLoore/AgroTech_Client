import { useState, useEffect, useMemo } from 'react';
import { getAgroClimas, createAgroClima, updateAgroClima, deleteAgroClima } from '../../api/AgroClima.api';
import type { AgroClima } from './AgroClima.types';
import { toast } from 'sonner';

export const useAgroClima = () => {
    const [climas, setClimas] = useState<AgroClima[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const [busqueda, setBusqueda] = useState<string>("");

    const [modal, setModal] = useState<boolean>(false);
    const [editando, setEditando] = useState<AgroClima | null>(null);
    const [form, setForm] = useState<Record<string, any>>({}); 
    const [guardando, setGuardando] = useState<boolean>(false);
    const [formError, setFormError] = useState<string>("");

    const fetchClimas = async () => {
        setLoading(true);
        try {
            const response = await getAgroClimas();
            // Asumiendo que tu backend devuelve { climas: [...] }
            setClimas(response.data.climas || []);
        } catch (err: any) {
            setError(err.message || "Error al obtener los registros climáticos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClimas();
    }, []);

    const climasFiltrados = useMemo(() => {
        return climas.filter(c => 
            String(c.clim_fecha || "").toLowerCase().includes(busqueda.toLowerCase()) ||
            String(c.clim_temperatura || "").includes(busqueda)
        );
    }, [climas, busqueda]);

    const onNuevo = () => {
        setEditando(null);
        setForm({ clim_temperatura: "", clim_humedad_relativa: "", clim_precipitacion: "", seccionId: "" }); 
        setFormError("");
        setModal(true);
    };

    const onEditar = (item: AgroClima) => {
        setEditando(item);
        setForm({ ...item });
        setFormError("");
        setModal(true);
    };

    const onCerrar = () => {
        setModal(false);
    };

    const onGuardar = async () => {
        setGuardando(true);
        setFormError("");
        try {
            if (editando) {
                await updateAgroClima(editando.clim_clima, form);
                toast.success("Registro climático actualizado correctamente");
            } else {
                await createAgroClima(form);
                toast.success("Registro climático creado exitosamente");
            }
            await fetchClimas();
            setModal(false);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Error al guardar el clima";
            setFormError(msg);
            toast.error(msg);
        } finally {
            setGuardando(false);
        }
    };

    const onEliminar = (item: AgroClima) => {
        toast.warning(`¿Estás seguro de ELIMINAR permanentemente este registro climático?`, {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        await deleteAgroClima(item.clim_clima);
                        await fetchClimas();
                        toast.success("Registro climático eliminado correctamente");
                    } catch (err: any) {
                        toast.error("Error al eliminar el registro");
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} }
        });
    };

    return {
        climas: climasFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        onNuevo, onEditar, onEliminar, onGuardar, onCerrar
    };
};